import { NextResponse } from "next/server";
import { findAgentBySlug, runAgentSync } from "@/lib/store";
import { getTweetText } from "@/lib/tweet";
import {
  summarizeTweetWithFireworks,
  moderateWithFireworks,
} from "@/lib/providers/fireworks";

export async function POST(request, { params }) {
  try {
    const agent = findAgentBySlug(params.slug);
    if (!agent)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    const body = await request.json();
    const input = body?.input ?? "";
    const mode = body?.mode === "concise" ? "concise" : "detailed";
    if (!input || typeof input !== "string") {
      return NextResponse.json(
        { error: "'input' string is required" },
        { status: 400 }
      );
    }
    // If tweet-summarizer: use Fireworks if configured, else local
    if (agent.slug === "tweet-summarizer") {
      const tweetText = await getTweetText(input);
      if (process.env.FIREWORKS_API_KEY) {
        const summaryText = await summarizeTweetWithFireworks(tweetText, {
          mode,
        });
        return NextResponse.json({
          status: "done",
          output: summaryText,
          cost: 0,
          provider: "fireworks",
        });
      }
    }
    if (agent.slug === "chat-moderator") {
      if (process.env.FIREWORKS_API_KEY) {
        const result = await moderateWithFireworks(input);
        return NextResponse.json({
          status: "done",
          output: JSON.stringify(result, null, 2),
          cost: 0,
          provider: "fireworks",
        });
      }
      // fallback to simple rule-based
      const lower = input.toLowerCase();
      const rules = [
        {
          keyword: "seed phrase",
          action: "block",
          reason: "Never ask seed phrase",
        },
        {
          keyword: "private key",
          action: "block",
          reason: "Never ask private key",
        },
        {
          keyword: "airdrop",
          action: "warn",
          reason: "Potential scam giveaway",
        },
        {
          keyword: "free",
          action: "warn",
          reason: "Too-good-to-be-true offer",
        },
      ];
      const hits = rules.filter((r) => lower.includes(r.keyword));
      let decision = "allow";
      if (hits.some((h) => h.action === "block")) decision = "block";
      else if (hits.some((h) => h.action === "warn")) decision = "warn";
      return NextResponse.json({
        status: "done",
        output: JSON.stringify(
          {
            decision,
            severity: decision === "block" ? 90 : decision === "warn" ? 60 : 10,
            reasons: hits.map((h) => h.reason),
            highlights: hits.map((h) => h.keyword),
          },
          null,
          2
        ),
        cost: 0,
        provider: "rules",
      });
    }
    const result = runAgentSync(agent, input);
    return NextResponse.json({ status: "done", ...result });
  } catch (err) {
    return NextResponse.json(
      { error: String(err.message || err) },
      { status: 400 }
    );
  }
}
