export default function Section({ title, subtitle, children, right }) {
  return (
    <section className="w-full max-w-6xl mx-auto">
      <div className="flex items-end justify-between mb-6">
        <div>
          {title ? (
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">
              {title}
            </h2>
          ) : null}
          {subtitle ? (
            <p className="text-sm text-black/60 dark:text-white/60 mt-1">
              {subtitle}
            </p>
          ) : null}
        </div>
        {right ? <div className="text-sm">{right}</div> : null}
      </div>
      {children}
    </section>
  );
}
