export const categories = [
  {
    id: "learning",
    name: "Learning & Knowledge",
    description: "Research, tutoring, and Q&A agents",
  },
  {
    id: "trading",
    name: "Trading & Finance",
    description: "Market analysis, alerts, and portfolio tools",
  },
  {
    id: "community",
    name: "Community & Social",
    description: "Moderation, FAQ, and engagement bots",
  },
  {
    id: "creative",
    name: "Creative",
    description: "Memes, music, and storytelling",
  },
  {
    id: "productivity",
    name: "Developer & Productivity",
    description: "Code helpers, docs, automations",
  },
  {
    id: "specialized",
    name: "Specialized / Niche",
    description: "Legal, health, and training assistants",
  },
];
const author = { name: "Anuoluwapo MG" };
export const agents = [
  {
    slug: "tweet-summarizer",
    name: "Tweet Summarizer",
    shortDescription:
      "Summarizes tweets and extracts hashtags, mentions, and links.",
    longDescription:
      "Paste a tweet URL or tweet text to get a concise summary and entities.",
    categoryId: "learning",
    rating: 4.8,
    votes: 0,
    tags: ["summarization", "twitter", "x"],
    price: "Free",
    author,
  },
  {
    slug: "chat-moderator",
    name: "Chat Moderator",
    shortDescription:
      "Auto-detects scams/spam and suggests moderation actions.",
    longDescription:
      "Paste a message and see whether it should be allowed, warned, or blocked.",
    categoryId: "community",
    rating: 4.9,
    votes: 0,
    tags: ["moderation", "discord", "telegram"],
    price: "Free",
    author,
  },
];

export function getAgentsByCategory(categoryId) {
  return agents.filter((a) => a.categoryId === categoryId);
}

export function getAgentBySlug(slug) {
  return agents.find((a) => a.slug === slug) || null;
}

export const featuredAgentSlugs = ["tweet-summarizer", "chat-moderator"];

export const trendingAgentSlugs = ["chat-moderator", "tweet-summarizer"];
