"use client";

import { useMemo, useState } from "react";
import { Inter } from "next/font/google";
import { isTweetUrl } from "@/lib/tweet";

const inter = Inter({ subsets: ["latin"], weight: ["400", "700"] });

export default function ClientRunner({ slug }) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [output, setOutput] = useState("");
  const [animateKey, setAnimateKey] = useState(0);
  const [mode, setMode] = useState("detailed");
  const [decision, setDecision] = useState(50);

  // Chat Moderator is bot-oriented; show CTAs instead of input form
  if (slug === "chat-moderator") {
    const tgUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || "";
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";
    const webhookUrl = baseUrl ? `${baseUrl}/api/webhooks/telegram` : "";

    return (
      <div className="space-y-4">
        <div className="text-sm text-black/70 dark:text-white/70">
          Connect the Chat Moderator to your Telegram community. It auto-detects
          scams/spam and suggests moderation actions.
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <a
            href={tgUsername ? `https://t.me/${tgUsername}` : undefined}
            target="_blank"
            rel="noopener noreferrer"
            className={`rounded-lg px-3 py-2 text-sm border ${
              tgUsername
                ? "border-black/[.12] dark:border-white/[.18] hover:bg-black/[.04] dark:hover:bg-white/[.06]"
                : "opacity-50 cursor-not-allowed border-black/[.12] dark:border-white/[.18]"
            }`}
            aria-disabled={!tgUsername}
          >
            Open Telegram bot
            {tgUsername ? "" : " (set NEXT_PUBLIC_TELEGRAM_BOT_USERNAME)"}
          </a>
          <a
            href={
              tgUsername
                ? `https://t.me/${tgUsername}?startgroup=true`
                : undefined
            }
            target="_blank"
            rel="noopener noreferrer"
            className={`rounded-lg px-3 py-2 text-sm border ${
              tgUsername
                ? "border-black/[.12] dark:border-white/[.18] hover:bg-black/[.04] dark:hover:bg-white/[.06]"
                : "opacity-50 cursor-not-allowed border-black/[.12] dark:border-white/[.18]"
            }`}
            aria-disabled={!tgUsername}
          >
            Add to a Telegram group
          </a>
          {webhookUrl ? (
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(webhookUrl)}
              className="rounded-lg px-3 py-2 text-sm border border-black/[.12] dark:border-white/[.18] hover:bg-black/[.04] dark:hover:bg-white/[.06]"
            >
              Copy webhook URL
            </button>
          ) : null}
        </div>
        <div
          className={`${inter.className} text-xs rounded-lg border border-black/[.08] dark:border-white/[.12] p-3 bg-black/[.02] dark:bg-white/[.04]`}
        >
          <div className="font-semibold mb-1">Setup steps</div>
          <ol className="list-decimal pl-5 space-y-1">
            <li>Deploy the app and set FIREWORKS_API_KEY on your host.</li>
            <li>
              Set Telegram webhook to {webhookUrl || "/api/webhooks/telegram"}.
            </li>
            <li>Make the bot admin in your group (optional for actions).</li>
            <li>Messages are classified: ALLOW / WARN / BLOCK with reasons.</li>
          </ol>
        </div>
      </div>
    );
  }

  const { mainKeyPoint, bullets, whyItMatters, optionalContext, tldr } =
    useMemo(() => {
      const text = String(output || "");
      const lines = text.split(/\r?\n/);
      let mkp = "";
      const points = [];
      let reason = "";
      let context = "";
      let tldrLine = "";

      let section = "";
      for (const raw of lines) {
        const line = raw.trim();
        if (!line) continue;
        if (/^main key point\s*:/i.test(line)) {
          section = "main";
          mkp = line.replace(/^main key point\s*:/i, "").trim();
          continue;
        }
        if (/^key points\s*:/i.test(line)) {
          section = "bullets";
          continue;
        }
        if (/^why it matters\s*:/i.test(line)) {
          section = "why";
          reason += line.replace(/^why it matters\s*:/i, "").trim();
          continue;
        }
        if (/^optional context\s*:/i.test(line)) {
          section = "context";
          context += line.replace(/^optional context\s*:/i, "").trim();
          continue;
        }
        if (/^tl;dr\s*:/i.test(line)) {
          section = "tldr";
          tldrLine = line.replace(/^tl;dr\s*:/i, "").trim();
          continue;
        }

        if (section === "bullets" && /^[-•]/.test(line)) {
          points.push(line.replace(/^[-•]\s*/, "").trim());
        } else if (section === "why") {
          reason += (reason ? "\n" : "") + line;
        } else if (section === "context") {
          context += (context ? "\n" : "") + line;
        }
      }
      return {
        mainKeyPoint: mkp,
        bullets: points,
        whyItMatters: reason,
        optionalContext: context,
        tldr: tldrLine,
      };
    }, [output]);

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setOutput("");
    try {
      const resp = await fetch(`/api/agents/${slug}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input, mode }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.error || "Failed to run agent");
      setOutput(String(data.output ?? ""));
      try {
        const parsed = JSON.parse(String(data.output ?? ""));
        if (parsed && typeof parsed.severity === "number") {
          setDecision(parsed.severity);
        }
      } catch {}
      setAnimateKey((k) => k + 1);
    } catch (err) {
      setError(String(err.message || err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm text-black/70 dark:text-white/70">Mode</div>
        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => setMode("concise")}
            className={`rounded px-2 py-1 border ${
              mode === "concise"
                ? "bg-black/[.08] dark:bg-white/[.12]"
                : "border-black/[.12] dark:border-white/[.18] hover:bg-black/[.04] dark:hover:bg-white/[.06]"
            }`}
          >
            Concise
          </button>
          <button
            type="button"
            onClick={() => setMode("detailed")}
            className={`rounded px-2 py-1 border ${
              mode === "detailed"
                ? "bg-black/[.08] dark:bg-white/[.12]"
                : "border-black/[.12] dark:border-white/[.18] hover:bg-black/[.04] dark:hover:bg-white/[.06]"
            }`}
          >
            Detailed
          </button>
        </div>
      </div>
      <textarea
        className="w-full rounded-lg border border-black/[.1] dark:border-white/[.15] p-3 bg-transparent"
        rows={5}
        placeholder="Type your prompt or paste a link..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      <button
        type="submit"
        disabled={loading || !input.trim()}
        className="w-full rounded-lg bg-foreground text-background py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50"
      >
        {loading ? "Running..." : "Run Agent"}
      </button>
      {error ? (
        <div className="text-sm text-red-600 dark:text-red-400">{error}</div>
      ) : null}
      {loading ? (
        <div className="mt-5 space-y-3">
          <div className="h-7 w-2/3 rounded skeleton" />
          <div className="h-24 w-full rounded skeleton" />
        </div>
      ) : output ? (
        <div key={animateKey} className="space-y-4 animate-fadeIn mt-5">
          {mainKeyPoint ? (
            <div className={`${inter.className} font-bold text-3xl`}>
              {mainKeyPoint}
            </div>
          ) : null}

          <div className="flex gap-2 text-xs">
            <button
              type="button"
              className="rounded border border-black/[.12] dark:border-white/[.18] px-2 py-1 hover:bg-black/[.04] dark:hover:bg-white/[.06]"
              onClick={() => navigator.clipboard.writeText(output)}
            >
              Copy summary
            </button>
            {tldr ? (
              <button
                type="button"
                className="rounded border border-black/[.12] dark:border-white/[.18] px-2 py-1 hover:bg-black/[.04] dark:hover:bg-white/[.06]"
                onClick={() => navigator.clipboard.writeText(tldr)}
              >
                Copy TL;DR
              </button>
            ) : null}
            {isTweetUrl(input) ? (
              <a
                className="rounded border border-black/[.12] dark:border-white/[.18] px-2 py-1 hover:bg-black/[.04] dark:hover:bg-white/[.06]"
                href={input.trim()}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open tweet
              </a>
            ) : null}
          </div>

          {bullets?.length ? (
            <div
              className={`${inter.className} text-sm rounded-lg border border-black/[.08] dark:border-white/[.12] p-3 bg-black/[.02] dark:bg-white/[.04]`}
            >
              <div className="font-semibold mb-2">Key points</div>
              <ul className="list-disc pl-5 space-y-1">
                {bullets.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {/* Moderation result card (only visible for chat-moderator outputs) */}
          {(() => {
            try {
              const p = JSON.parse(String(output || ""));
              if (!p || !p.decision) return null;
              return (
                <div
                  className={`${inter.className} text-sm rounded-lg border border-black/[.08] dark:border-white/[.12] p-3 bg-black/[.02] dark:bg-white/[.04]`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-semibold">Moderation decision</div>
                    <span className="rounded px-2 py-0.5 text-xs border border-black/[.12] dark:border-white/[.18] uppercase">
                      {p.decision}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={
                        typeof p.severity === "number" ? p.severity : decision
                      }
                      readOnly
                      className="w-full"
                    />
                    <span className="text-xs w-10 text-right">
                      {typeof p.severity === "number" ? p.severity : decision}
                    </span>
                  </div>
                  {Array.isArray(p.highlights) && p.highlights.length ? (
                    <div className="mt-2 text-xs">
                      <span className="font-semibold">Highlights:</span>{" "}
                      {p.highlights.join(", ")}
                    </div>
                  ) : null}
                  {Array.isArray(p.reasons) && p.reasons.length ? (
                    <ul className="mt-2 list-disc pl-5 space-y-1">
                      {p.reasons.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              );
            } catch {
              return null;
            }
          })()}

          {whyItMatters ? (
            <div
              className={`${inter.className} text-sm rounded-lg border border-black/[.08] dark:border-white/[.12] p-3 bg-black/[.02] dark:bg-white/[.04]`}
            >
              <div className="font-semibold mb-1">Why it matters</div>
              <p className="whitespace-pre-wrap">{whyItMatters}</p>
            </div>
          ) : null}

          {optionalContext ? (
            <div
              className={`${inter.className} text-sm rounded-lg border border-black/[.08] dark:border-white/[.12] p-3 bg-black/[.02] dark:bg-white/[.04]`}
            >
              <div className="font-semibold mb-1">Optional context</div>
              <p className="whitespace-pre-wrap">{optionalContext}</p>
            </div>
          ) : null}

          {tldr ? (
            <div
              className={`${inter.className} text-sm rounded-lg border border-black/[.08] dark:border-white/[.12] p-3 bg-black/[.02] dark:bg-white/[.04]`}
            >
              <span className="font-semibold">TL;DR:</span> {tldr}
            </div>
          ) : null}
        </div>
      ) : null}
    </form>
  );
}
