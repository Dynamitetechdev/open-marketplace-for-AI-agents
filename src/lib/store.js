import { agents as seedAgents } from "./data";

// Simple in-memory store for MVP. In production, replace with a DB.
const state = {
  agents: [...seedAgents],
  sessions: new Map(), // key: chatId/platform -> { mode, threshold }
};

export function listAgents() {
  return state.agents;
}

export function findAgentBySlug(slug) {
  return state.agents.find((a) => a.slug === slug) || null;
}

export function createAgent(partial) {
  const slug = (partial.slug || partial.name || "agent")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  const exists = findAgentBySlug(slug);
  if (exists) throw new Error("Agent with slug already exists");
  const agent = {
    slug,
    name: partial.name || "Untitled Agent",
    shortDescription: partial.shortDescription || "",
    longDescription: partial.longDescription || partial.description || "",
    categoryId: partial.categoryId || "community",
    rating: 0,
    votes: 0,
    tags: partial.tags || [],
    price: partial.price || "Free",
    author: partial.author || { name: "Anonymous" },
    config: partial.config || { basePrompt: "You are a helpful AI agent." },
  };
  state.agents.unshift(agent);
  return agent;
}

export function updateAgent(slug, updates) {
  const idx = state.agents.findIndex((a) => a.slug === slug);
  if (idx === -1) return null;
  const updated = { ...state.agents[idx], ...updates };
  state.agents[idx] = updated;
  return updated;
}

export function runAgentSync(agent, input) {
  const text = String(input || "");
  const basePrompt = agent?.config?.basePrompt || "You are a helpful AI agent.";
  if (agent.slug === "tweet-summarizer") {
    const hashtags = Array.from(
      new Set((text.match(/#[\w_]+/g) || []).map((s) => s.toLowerCase()))
    );
    const mentions = Array.from(
      new Set((text.match(/@[\w_]+/g) || []).map((s) => s.toLowerCase()))
    );
    const links = Array.from(new Set(text.match(/https?:\/\/\S+/g) || []));
    const cleaned = text.replace(/\s+/g, " ").trim();
    const summary = cleaned.slice(0, 200);
    const result = {
      type: "tweet_summary",
      summary,
      hashtags,
      mentions,
      links,
    };
    return {
      output: JSON.stringify(result, null, 2),
      cost: 0,
      provider: "mock",
    };
  }
  if (agent.slug === "chat-moderator") {
    const lower = text.toLowerCase();
    const rules = [
      { keyword: "airdrop", action: "warn", reason: "Potential scam airdrop" },
      { keyword: "free", action: "warn", reason: "Too-good-to-be-true offer" },
      {
        keyword: "seed phrase",
        action: "block",
        reason: "Never ask for seed phrase",
      },
      {
        keyword: "private key",
        action: "block",
        reason: "Never ask for private key",
      },
      {
        keyword: "whatsapp",
        action: "warn",
        reason: "Off-platform redirection",
      },
      { keyword: "dm me", action: "warn", reason: "Unsolicited DMs" },
    ];
    const hits = rules.filter((r) => lower.includes(r.keyword));
    let decision = "allow";
    if (hits.some((h) => h.action === "block")) decision = "block";
    else if (hits.some((h) => h.action === "warn")) decision = "warn";
    const result = {
      type: "moderation",
      decision,
      matches: hits,
      policy: {
        basePrompt,
      },
    };
    return {
      output: JSON.stringify(result, null, 2),
      cost: 0,
      provider: "mock",
    };
  }
  const output = `${basePrompt}\n\nUser: ${text}\n\nAgent: Here's a draft response for: "${text.slice(
    0,
    160
  )}"`;
  return { output, cost: 0, provider: "mock" };
}

export function getSession(key) {
  if (!state.sessions.has(key)) {
    state.sessions.set(key, { mode: "detailed", threshold: 70 });
  }
  return state.sessions.get(key);
}

export function setSession(key, updates) {
  const cur = getSession(key);
  const next = { ...cur, ...updates };
  state.sessions.set(key, next);
  return next;
}
