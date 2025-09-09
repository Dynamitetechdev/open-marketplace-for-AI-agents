import { NextResponse } from "next/server";
import { findAgentBySlug, updateAgent } from "@/lib/store";
import { requireAuth } from "@/lib/auth";

export async function GET(_request, { params }) {
  const agent = findAgentBySlug(params.slug);
  if (!agent) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(agent);
}

export async function PATCH(request, { params }) {
  const user = await requireAuth(request);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const updates = await request.json();
  const agent = findAgentBySlug(params.slug);
  if (!agent) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (agent.author?.wallet && agent.author.wallet !== user.wallet) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const updated = updateAgent(params.slug, updates || {});
  return NextResponse.json(updated);
}
