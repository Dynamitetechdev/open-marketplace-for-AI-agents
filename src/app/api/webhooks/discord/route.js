import { NextResponse } from "next/server";
import { verifyDiscordSignature } from "@/lib/discord";

export const runtime = "nodejs";

async function jsonBody(request) {
  const text = await request.text();
  return { text, json: JSON.parse(text || "{}") };
}

export async function POST(request) {
  const publicKey = process.env.DISCORD_PUBLIC_KEY;
  const signature = request.headers.get("x-signature-ed25519");
  const timestamp = request.headers.get("x-signature-timestamp");
  const { text, json } = await jsonBody(request);
  if (
    !verifyDiscordSignature({ bodyText: text, signature, timestamp, publicKey })
  ) {
    return new NextResponse("Bad request signature", { status: 401 });
  }

  // PING
  if (json?.type === 1) {
    return NextResponse.json({ type: 1 });
  }

  const content = json?.data?.options?.[0]?.value || json?.data?.name || "";
  const messageText = String(content || "");

  // Call our moderator
  const resp = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/agents/chat-moderator/run`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input: messageText }),
    }
  );
  const data = await resp.json().catch(() => ({}));
  let replyText = "allow";
  try {
    const parsed = JSON.parse(String(data.output || ""));
    replyText = `Decision: ${parsed.decision}\nSeverity: ${
      parsed.severity
    }\nReasons: ${(parsed.reasons || []).join(", ")}`;
  } catch {
    replyText = String(data.output || "allow");
  }

  return NextResponse.json({
    type: 4, // CHANNEL_MESSAGE_WITH_SOURCE
    data: { content: replyText },
  });
}
