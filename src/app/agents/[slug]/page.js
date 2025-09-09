import Link from "next/link";
import { getAgentBySlug } from "../../../lib/data";
import ClientRunner from "./ClientRunner";

export default function AgentPage({ params }) {
  const agent = getAgentBySlug(params.slug);

  if (!agent) {
    return (
      <div className="px-6 py-16 max-w-3xl mx-auto">
        <h1 className="text-2xl font-semibold mb-2">Agent not found</h1>
        <p className="text-black/70 dark:text-white/70 mb-6">
          The agent you are looking for does not exist.
        </p>
        <Link className="underline" href="/">
          Back to marketplace
        </Link>
      </div>
    );
  }

  return (
    <div className="px-6 py-10 max-w-5xl mx-auto">
      <div className="mb-6">
        <Link className="text-sm underline" href="/">
          ← Back
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-6">
        <div className="h-20 w-20 shrink-0 rounded-2xl bg-black/[.06] dark:bg-white/[.08] grid place-items-center text-3xl">
          {agent.name?.charAt(0) ?? "A"}
        </div>
        <div className="min-w-0">
          <h1 className="text-3xl font-semibold tracking-tight">
            {agent.name}
          </h1>
          <p className="text-black/70 dark:text-white/70 mt-1">
            {agent.shortDescription}
          </p>
          <div className="mt-3 flex items-center gap-3 text-sm">
            <span className="rounded-full px-2 py-1 bg-black/[.05] dark:bg-white/[.08]">
              {agent.price}
            </span>
            <span className="text-black/60 dark:text-white/60">
              by {agent.author?.name ?? "Unknown"}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 items-start">
        <article className="prose dark:prose-invert max-w-none">
          <h2>About this agent</h2>
          <p>{agent.longDescription}</p>
          {agent.tags?.length ? (
            <p>
              <strong>Tags:</strong> {agent.tags.join(", ")}
            </p>
          ) : null}
        </article>
      </div>

      <div className="mt-10">
        <div className="rounded-xl border border-black/[.08] dark:border-white/[.12] p-4">
          <h3 className="font-semibold mb-2">Try it</h3>
          <p className="text-sm text-black/70 dark:text-white/70 mb-4">
            Run the agent with your own input.
          </p>
          <ClientRunner slug={agent.slug} />
        </div>
      </div>
    </div>
  );
}
