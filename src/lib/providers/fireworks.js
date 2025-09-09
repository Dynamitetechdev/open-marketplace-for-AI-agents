const API_URL = "https://api.fireworks.ai/inference/v1/chat/completions";

export async function callFireworksChat({
  messages,
  model = process.env.FIREWORKS_MODEL ||
    "sentientfoundation/dobby-unhinged-llama-3-3-70b-new",
  temperature = 0.7,
  topP = 1,
  maxTokens = 500,
  stream = false,
  responseFormat,
} = {}) {
  const apiKey = process.env.FIREWORKS_API_KEY;
  if (!apiKey) throw new Error("FIREWORKS_API_KEY is not set");

  const resp = await fetch(API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: Math.min(maxTokens, 500),
      temperature,
      top_p: topP,
      stream,
      ...(responseFormat ? { response_format: responseFormat } : {}),
    }),
    cache: "no-store",
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    const message = data?.error || `Fireworks error ${resp.status}`;
    throw new Error(message);
  }
  const text = data?.choices?.[0]?.message?.content ?? "";
  return { raw: data, text: String(text || "") };
}

export async function summarizeTweetWithFireworks(
  tweetText,
  { mode = "detailed" } = {}
) {
  const messages = [
    {
      role: "system",
      content:
        "You write clear, educative, neutral summaries for social posts. Output PLAIN TEXT only (no JSON, no code fences, no markdown blocks). Be specific, actionable, and helpful to a general audience.",
    },
    {
      role: "user",
      content:
        mode === "concise"
          ? `Summarize this tweet for a general audience. Output PLAIN TEXT ONLY with the following:\nMain key point: <one short sentence>\nKey points:\n- <1>\n- <2>\nTL;DR: <one sentence>\n\nTweet text:\n${tweetText}`
          : `Summarize this tweet for a general audience. Produce the following sections in plain text ONLY:\n\nMain key point: <one sentence capturing the core takeaway>\nKey points:\n- <concise point 1>\n- <concise point 2>\n- <concise point 3>\nWhy it matters: <1-2 sentences explaining significance/implications>\nOptional context: <1-2 sentences if helpful; skip if not>\nTL;DR: <one-sentence summary>\n\nTweet text:\n${tweetText}`,
    },
  ];
  const { text } = await callFireworksChat({
    messages,
    maxTokens: 500,
    temperature: 0.6,
  });
  const cleaned = String(text || "")
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
  return cleaned;
}

export async function moderateWithFireworks(messageText) {
  const messages = [
    {
      role: "system",
      content:
        "You are a content moderation assistant for online communities. Always return STRICT JSON only.",
    },
    {
      role: "user",
      content: `Classify the message. Output STRICT JSON ONLY with keys: decision (one of: "allow","warn","block"), severity (0-100), reasons (string[]), highlights (string[]). No extra text. Message:\n\n${messageText}`,
    },
  ];
  const { text } = await callFireworksChat({
    messages,
    temperature: 0.0,
    maxTokens: 300,
    responseFormat: { type: "json_object" },
  });
  try {
    return JSON.parse(text);
  } catch (_err) {
    try {
      const m = String(text || "").match(/\{[\s\S]*\}/);
      if (m) return JSON.parse(m[0]);
    } catch {}
    return {
      decision: "allow",
      severity: 10,
      reasons: ["Model returned non-JSON"],
      highlights: [],
    };
  }
}
