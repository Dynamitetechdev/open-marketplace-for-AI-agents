import Link from "next/link";

function StarRating({ rating }) {
  const fullStars = Math.round(rating);
  return (
    <div className="text-amber-500" aria-label={`Rating ${rating} out of 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i}>{i < fullStars ? "★" : "☆"}</span>
      ))}
    </div>
  );
}

export default function AgentCard({ agent }) {
  return (
    <Link
      href={`/agents/${agent.slug}`}
      className="group block rounded-xl border border-black/[.08] dark:border-white/[.12] p-4 hover:shadow-sm transition-shadow bg-background"
    >
      <div className="flex items-start gap-3">
        <div className="h-12 w-12 shrink-0 rounded-lg bg-black/[.06] dark:bg-white/[.08] grid place-items-center text-xl">
          {agent.name?.charAt(0) ?? "A"}
        </div>
        <div className="min-w-0">
          <h3 className="font-semibold truncate group-hover:underline">
            {agent.name}
          </h3>
          <p className="text-sm text-black/70 dark:text-white/70 line-clamp-2">
            {agent.shortDescription}
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <StarRating rating={agent.rating} />
          <span className="text-black/60 dark:text-white/60">
            ({agent.votes})
          </span>
        </div>
        <div className="text-xs rounded-full px-2 py-1 bg-black/[.05] dark:bg-white/[.08]">
          {agent.price}
        </div>
      </div>

      {agent.tags?.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {agent.tags.slice(0, 3).map((t) => (
            <span
              key={t}
              className="text-xs rounded-full px-2 py-1 border border-black/[.08] dark:border-white/[.12]"
            >
              {t}
            </span>
          ))}
        </div>
      ) : null}
    </Link>
  );
}
