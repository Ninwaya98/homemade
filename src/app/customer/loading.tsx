export default function CustomerLoading() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-64 animate-pulse rounded-lg bg-stone-200" />
      <div className="flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-8 w-20 animate-pulse rounded-full bg-stone-200"
          />
        ))}
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-stone-200 bg-white p-5"
        >
          <div className="flex items-start gap-4">
            <div className="h-16 w-16 animate-pulse rounded-full bg-stone-200" />
            <div className="flex-1 space-y-2">
              <div className="h-5 w-40 animate-pulse rounded bg-stone-200" />
              <div className="h-3 w-24 animate-pulse rounded bg-stone-100" />
              <div className="h-4 w-full animate-pulse rounded bg-stone-100" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
