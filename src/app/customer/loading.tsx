export default function CustomerLoading() {
  return (
    <div className="space-y-6">
      <div>
        <div className="shimmer h-8 w-64 rounded-lg" />
        <div className="shimmer mt-2 h-4 w-40 rounded" />
      </div>
      <div className="flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="shimmer h-9 w-20 rounded-full" />
        ))}
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-sm"
        >
          <div className="flex items-start gap-4 p-5">
            <div className="shimmer h-16 w-16 flex-none rounded-2xl" />
            <div className="flex-1 space-y-2.5">
              <div className="shimmer h-5 w-40 rounded" />
              <div className="shimmer h-3 w-28 rounded" />
              <div className="flex gap-1.5">
                <div className="shimmer h-5 w-14 rounded-full" />
                <div className="shimmer h-5 w-16 rounded-full" />
              </div>
              <div className="shimmer h-4 w-full rounded" />
            </div>
          </div>
          <div className="border-t border-stone-100 bg-stone-50/50 p-5">
            <div className="shimmer mb-3 h-3 w-20 rounded" />
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="shimmer h-20 rounded-xl" />
              <div className="shimmer h-20 rounded-xl" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
