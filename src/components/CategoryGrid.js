export default function CategoryGrid({ categories, categoryIdToCount }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {categories.map((cat) => (
        <div
          key={cat.id}
          className="rounded-xl border border-black/[.08] dark:border-white/[.12] p-4 bg-background"
        >
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold">{cat.name}</h3>
              <p className="text-sm text-black/70 dark:text-white/70">
                {cat.description}
              </p>
            </div>
            <div className="text-xs rounded-full px-2 py-1 bg-black/[.05] dark:bg-white/[.08]">
              {categoryIdToCount[cat.id] ?? 0} agents
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
