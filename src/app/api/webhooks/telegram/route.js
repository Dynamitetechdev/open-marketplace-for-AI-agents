import { NextResponse } from "next/server";
import { getSession, setSession } from "@/lib/store";

// Optional: keep it edge-compatible (remove if issues)
export const runtime = "edge";

// Utility: Send a Telegram message
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

// ✅ GET route: for browser testing
export async function GET() {
  return NextResponse.json({
    ok: true,
    message: "Telegram webhook is live",
  });
}

// ✅ POST route: for Telegram updates
export async function POST(request) {
  try {
    const update = await request.json();
    const message = update?.message || update?.edited_message;
    if (!message) return NextResponse.json({ ok: true });

    const chatId = message.chat.id;
    const text = String(message.text || "");
    const sessionKey = `tg:${chatId}`;
    const session = getSession(sessionKey);

    // Commands
    if (text.startsWith("/start")) {
      await sendTelegramMessage(
        chatId,
        "Welcome! I auto-detect scams/spam and suggest moderation actions. Send any message and I'll classify it. Use /threshold 0-100 to set the alert level (default 70)."
      );
      return NextResponse.json({ ok: true });
    }
    if (text.startsWith("/help")) {
      await sendTelegramMessage(
        chatId,
        "Commands:\n/threshold <0-100> — set alert severity (default 70).\nSend any message and I'll reply with: allow/warn/block, severity, highlights, reasons."
      );
      return NextResponse.json({ ok: true });
    }
    if (text.startsWith("/threshold ")) {
      const n = Number(text.split(/\s+/)[1]);
      if (Number.isFinite(n) && n >= 0 && n <= 100) {
        setSession(sessionKey, { threshold: n });
        await sendTelegramMessage(chatId, `Threshold set to ${n}`);
      } else {
        await sendTelegramMessage(
          chatId,
          "Provide a number between 0 and 100."
        );
      }
      return NextResponse.json({ ok: true });
    }

    // Always moderate: auto-detect scams/spam and suggest actions
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
      const threshold = session.threshold ?? 70;
      const suggested = parsed.decision
        ? parsed.decision.toUpperCase()
        : "ALLOW";
      reply = `Suggested action: ${suggested}\nSeverity: ${
        parsed.severity
      }\nHighlights: ${(parsed.highlights || []).join(", ")}\nReasons: ${(
        parsed.reasons || []
      ).join(", ")}`;
      if (parsed.severity >= threshold && parsed.decision !== "allow") {
        reply += `\nAlert: severity >= ${threshold}`;
      }
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
