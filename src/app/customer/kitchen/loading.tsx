export default function KitchenLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div>
        <div className="shimmer h-7 w-44 rounded-lg" />
        <div className="shimmer mt-2 h-4 w-64 rounded-lg" />
      </div>
      <div className="flex gap-2">
        {[64, 80, 56, 72, 60, 56, 64, 48].map((w, i) => (
          <div key={i} className="shimmer h-8 flex-none rounded-full" style={{ width: w }} />
        ))}
      </div>
      {[1, 2].map((i) => (
        <div key={i} className="rounded-2xl glass-strong overflow-hidden">
          <div className="flex items-start gap-4 p-5">
            <div className="shimmer h-16 w-16 flex-none rounded-2xl" />
            <div className="flex-1 space-y-2">
              <div className="shimmer h-5 w-36 rounded" />
              <div className="shimmer h-3 w-24 rounded" />
              <div className="flex gap-1.5">
                <div className="shimmer h-5 w-14 rounded-full" />
                <div className="shimmer h-5 w-16 rounded-full" />
              </div>
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
