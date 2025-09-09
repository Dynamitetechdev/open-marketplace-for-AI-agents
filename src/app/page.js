import {
  agents,
  categories,
  featuredAgentSlugs,
  trendingAgentSlugs,
} from "../lib/data";
import Section from "@/components/Section";
import AgentCard from "@/components/AgentCard";
import CategoryGrid from "@/components/CategoryGrid";
import WalletButton from "@/components/WalletButton";

export default function Home() {
  const featured = featuredAgentSlugs
    .map((slug) => agents.find((a) => a.slug === slug))
    .filter(Boolean);
  const trending = trendingAgentSlugs
    .map((slug) => agents.find((a) => a.slug === slug))
    .filter(Boolean);

  const categoryIdToCount = categories.reduce((acc, c) => {
    acc[c.id] = agents.filter((a) => a.categoryId === c.id).length;
    return acc;
  }, {});

  return (
    <div className="font-sans min-h-screen">
      <header className="w-full border-b border-black/[.08] dark:border-white/[.12]">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
              Open Agent Marketplace
            </h1>
            <p className="text-black/70 dark:text-white/70 mt-2">
              Discover, try, and share community-built AI agents.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a
              className="rounded-full border border-black/[.12] dark:border-white/[.18] px-4 py-2 text-sm hover:bg-black/[.04] dark:hover:bg-white/[.06]"
              href="/create"
            >
              Submit Agent
            </a>
            <WalletButton />
          </div>
        </div>
      </header>

      <main className="px-6 py-10 flex flex-col gap-12">
        <Section
          title="Featured"
          subtitle="Editors’ picks and community favorites"
          right={
            <a className="hover:underline" href="#">
              View all
            </a>
          }
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {featured.map((agent) => (
              <AgentCard key={agent.slug} agent={agent} />
            ))}
          </div>
        </Section>

        {/* <Section
          title="Trending"
          subtitle="Popular agents gaining traction this week"
          right={
            <a className="hover:underline" href="#">
              View leaderboard
            </a>
          }
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {trending.map((agent) => (
              <AgentCard key={agent.slug} agent={agent} />
            ))}
          </div>
        </Section> */}

        <Section
          title="Browse by category"
          subtitle="Explore the full ecosystem of AI helpers"
        >
          <CategoryGrid
            categories={categories}
            categoryIdToCount={categoryIdToCount}
          />
        </Section>
      </main>

      <footer className="px-6 py-10 border-t border-black/[.08] dark:border-white/[.12] text-sm text-black/70 dark:text-white/70">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between gap-4">
          <p>Built with Next.js. Community-owned, open marketplace.</p>
          <div className="flex gap-4">
            <a className="hover:underline" href="#">
              About
            </a>
            <a className="hover:underline" href="#">
              Docs
            </a>
            <a className="hover:underline" href="#">
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
