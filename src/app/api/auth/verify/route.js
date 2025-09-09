import { NextResponse } from "next/server";
import { verifyWalletSignature, signJWT } from "@/lib/auth";

export async function POST(request) {
  try {
    const body = await request.json();
    const { wallet, signature, nonce } = body || {};
    const verified = await verifyWalletSignature({ wallet, signature, nonce });
    if (!verified.ok)
      return NextResponse.json({ error: verified.error }, { status: 401 });
    const token = await signJWT({ wallet: String(wallet).toLowerCase() });
    return NextResponse.json({ token });
  } catch (err) {
    return NextResponse.json(
      { error: String(err.message || err) },
      { status: 400 }
    );
  }
}
