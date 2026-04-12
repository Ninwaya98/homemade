export default function FeedLoading() {
  return (
    <div className="space-y-8">
      {/* Greeting skeleton */}
      <div className="animate-pulse">
        <div className="shimmer h-7 w-52 rounded-lg" />
        <div className="shimmer mt-2 h-4 w-72 rounded-lg" />
      </div>

      {/* Pills skeleton */}
      <div className="flex gap-2 animate-pulse">
        {[80, 72, 64, 56, 72, 64].map((w, i) => (
          <div key={i} className="shimmer h-8 flex-none rounded-full" style={{ width: w }} />
        ))}
      </div>

      {/* Horizontal scroll sections */}
      {[1, 2, 3].map((section) => (
        <div key={section} className="space-y-3 animate-pulse">
          <div className="flex justify-between">
            <div className="shimmer h-5 w-32 rounded-lg" />
            <div className="shimmer h-4 w-14 rounded-lg" />
          </div>
          <div className="flex gap-3 overflow-hidden">
            {[1, 2, 3].map((card) => (
              <div key={card} className="w-44 flex-none rounded-2xl glass-strong overflow-hidden">
                <div className="shimmer h-28 w-full" />
                <div className="space-y-2 p-3">
                  <div className="shimmer h-4 w-24 rounded" />
                  <div className="shimmer h-3 w-16 rounded" />
                  <div className="shimmer h-4 w-14 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
