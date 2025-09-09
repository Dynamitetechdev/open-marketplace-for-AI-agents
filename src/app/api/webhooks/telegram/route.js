import { NextResponse } from "next/server";

export const runtime = "edge";

async function sendTelegramMessage(chatId, text) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return;
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
}

export async function POST(request) {
  try {
    const update = await request.json();
    const message = update?.message || update?.edited_message;
    if (!message) return NextResponse.json({ ok: true });
    const chatId = message.chat.id;
    const text = String(message.text || "");

    // Call our moderator
    const resp = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/agents/chat-moderator/run`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: text }),
      }
    );
    const data = await resp.json().catch(() => ({}));
    let reply = "allow";
    try {
      const parsed = JSON.parse(String(data.output || ""));
      reply = `Decision: ${parsed.decision}\nSeverity: ${
        parsed.severity
      }\nReasons: ${(parsed.reasons || []).join(", ")}`;
    } catch {
      reply = String(data.output || "allow");
    }
    await sendTelegramMessage(chatId, reply);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: String(err.message || err) },
      { status: 400 }
    );
  }
}
