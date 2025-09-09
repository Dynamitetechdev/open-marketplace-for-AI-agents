// Sentient Chat Completions client
export async function callSentientChat({
  messages,
  model = process.env.SENTIENT_MODEL ||
    "SentientAGI/Dobby-Mini-Unhinged-Plus-Llama-3.1-8B",
  max_tokens = 300,
  temperature = 0.7,
  top_p = 1,
  stream = false,
} = {}) {
  const url =
    process.env.SENTIENT_CHAT_URL ||
    "https://api.sentient.org/v1/chat/completions";
  const key = process.env.SENTIENT_KEY || process.env.SENTIENT_API_KEY;
  if (!url || !key) throw new Error("Sentient API not configured");
  const resp = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens,
      temperature,
      top_p,
      stream,
    }),
    cache: "no-store",
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    const message = data?.error || `Sentient error ${resp.status}`;
    throw new Error(message);
  }
  const text = data?.choices?.[0]?.message?.content ?? "";
  return { raw: data, text: String(text || "") };
}

export async function summarizeTweetWithSentient(tweetText) {
  const messages = [
    {
      role: "system",
      content:
        "You are a tweet summarizer. Always output valid JSON only, no extra text.",
    },
    {
      role: "user",
      content: `Summarize the tweet below in 1-2 sentences and extract entities. Output strictly valid JSON with keys: summary (string), hashtags (string[]), mentions (string[]), links (string[]). Tweet:\n\n${tweetText}`,
    },
  ];
  const { text } = await callSentientChat({ messages });
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (_err) {
    parsed = {
      summary: text.slice(0, 200),
      hashtags: [],
      mentions: [],
      links: [],
    };
  }
  return parsed;
}
