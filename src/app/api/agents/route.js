import { NextResponse } from "next/server";
import { listAgents, createAgent } from "@/lib/store";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  const data = listAgents().map((a) => ({
    slug: a.slug,
    name: a.name,
    shortDescription: a.shortDescription,
    categoryId: a.categoryId,
    price: a.price,
    rating: a.rating,
    votes: a.votes,
    tags: a.tags,
  }));
  return NextResponse.json({ agents: data });
}

export async function POST(request) {
  try {
    const user = await requireAuth(request);
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await request.json();
    const created = createAgent({
      ...body,
      author: { name: body?.author?.name || user.wallet, wallet: user.wallet },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: String(err.message || err) },
      { status: 400 }
    );
  }
}
