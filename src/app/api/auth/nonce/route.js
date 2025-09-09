import { NextResponse } from "next/server";
import { issueNonce } from "@/lib/auth";

export async function POST(request) {
  try {
    const body = await request.json();
    const { wallet } = body || {};
    const result = issueNonce(wallet);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: String(err.message || err) },
      { status: 400 }
    );
  }
}
