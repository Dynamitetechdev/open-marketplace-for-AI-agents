"use client";

import { useState } from "react";
import Link from "next/link";

export default function CreateAgentPage() {
  const [name, setName] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [categoryId, setCategoryId] = useState("community");
  const [basePrompt, setBasePrompt] = useState("You are a helpful AI agent.");
  const [error, setError] = useState("");
  const [created, setCreated] = useState(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const token = window.localStorage.getItem("jwt");
      if (!token) throw new Error("Please sign in with your wallet first.");
      const resp = await fetch("/api/agents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          shortDescription,
          categoryId,
          config: { basePrompt },
        }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.error || "Failed to create agent");
      setCreated(data);
    } catch (err) {
      setError(String(err.message || err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="px-6 py-10 max-w-3xl mx-auto">
      <div className="mb-6">
        <Link className="text-sm underline" href="/">
          ← Back
        </Link>
      </div>
      <h1 className="text-2xl font-semibold mb-4">Create an Agent</h1>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm mb-1">Name</label>
          <input
            className="w-full rounded-lg border border-black/[.1] dark:border-white/[.15] p-2 bg-transparent"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My Agent"
            required
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Short Description</label>
          <input
            className="w-full rounded-lg border border-black/[.1] dark:border-white/[.15] p-2 bg-transparent"
            value={shortDescription}
            onChange={(e) => setShortDescription(e.target.value)}
            placeholder="What does it do?"
            required
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Category</label>
          <select
            className="w-full rounded-lg border border-black/[.1] dark:border-white/[.15] p-2 bg-transparent"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="learning">Learning & Knowledge</option>
            <option value="trading">Trading & Finance</option>
            <option value="community">Community & Social</option>
            <option value="creative">Creative</option>
            <option value="productivity">Developer & Productivity</option>
            <option value="specialized">Specialized / Niche</option>
          </select>
        </div>
        <div>
          <label className="block text-sm mb-1">Base Prompt</label>
          <textarea
            className="w-full rounded-lg border border-black/[.1] dark:border-white/[.15] p-2 bg-transparent"
            rows={5}
            value={basePrompt}
            onChange={(e) => setBasePrompt(e.target.value)}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-foreground text-background px-4 py-2 text-sm hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create Agent"}
        </button>
        {error ? (
          <div className="text-sm text-red-600 dark:text-red-400">{error}</div>
        ) : null}
      </form>

      {created ? (
        <div className="mt-6 rounded-lg border border-black/[.1] dark:border-white/[.15] p-4">
          <div className="font-semibold mb-2">Created!</div>
          <div className="text-sm">
            View it here:{" "}
            <Link className="underline" href={`/agents/${created.slug}`}>
              /agents/{created.slug}
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
