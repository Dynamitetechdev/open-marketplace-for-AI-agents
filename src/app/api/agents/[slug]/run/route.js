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
      // Hybrid approach: apply rules first
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
        { keyword: "mnemonic", action: "block", reason: "Never ask mnemonic" },
        {
          keyword: "wallet passphrase",
          action: "block",
          reason: "Never ask passphrase",
        },
        {
          keyword: "airdrop",
          action: "warn",
          reason: "Potential scam giveaway",
        },
        {
          keyword: "free ",
          action: "warn",
          reason: "Too-good-to-be-true offer",
        },
        { keyword: "giveaway", action: "warn", reason: "Giveaway risk" },
        { keyword: "dm me", action: "warn", reason: "Unsolicited DM" },
      ];
      const ruleHits = rules.filter((r) => lower.includes(r.keyword));
      let ruleDecision = "allow";
      if (ruleHits.some((h) => h.action === "block")) ruleDecision = "block";
      else if (ruleHits.some((h) => h.action === "warn")) ruleDecision = "warn";

      // If Fireworks available, request JSON moderation
      if (process.env.FIREWORKS_API_KEY) {
        const llm = await moderateWithFireworks(input);
        // Merge results: strongest action wins; combine reasons/highlights; max severity
        const decisions = [ruleDecision, llm?.decision || "allow"];
        const strength = { allow: 0, warn: 1, block: 2 };
        const mergedDecision =
          decisions.sort((a, b) => strength[b] - strength[a])[0] || "allow";
        const severity = Math.max(
          mergedDecision === "block" ? 90 : mergedDecision === "warn" ? 60 : 10,
          typeof llm?.severity === "number" ? llm.severity : 0
        );
        const reasons = [
          ...new Set([
            ...ruleHits.map((h) => h.reason),
            ...(Array.isArray(llm?.reasons) ? llm.reasons : []),
          ]),
        ];
        const highlights = [
          ...new Set([
            ...ruleHits.map((h) => h.keyword),
            ...(Array.isArray(llm?.highlights) ? llm.highlights : []),
          ]),
        ];
        return NextResponse.json({
          status: "done",
          output: JSON.stringify(
            { decision: mergedDecision, severity, reasons, highlights },
            null,
            2
          ),
          cost: 0,
          provider: "hybrid",
        });
      }

      // No Fireworks: return rule-based
      return NextResponse.json({
        status: "done",
        output: JSON.stringify(
          {
            decision: ruleDecision,
            severity:
              ruleDecision === "block" ? 90 : ruleDecision === "warn" ? 60 : 10,
            reasons: ruleHits.map((h) => h.reason),
            highlights: ruleHits.map((h) => h.keyword),
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
