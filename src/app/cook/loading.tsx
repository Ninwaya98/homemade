export default function CookLoading() {
  return (
    <div className="space-y-6">
      <div className="shimmer h-8 w-48 rounded-lg" />
      <div className="rounded-2xl border border-stone-200/80 bg-white p-6 shadow-sm">
        <div className="space-y-3">
          <div className="shimmer h-6 w-3/4 rounded" />
          <div className="shimmer h-4 w-1/2 rounded" />
          <div className="shimmer h-4 w-2/3 rounded" />
        </div>
      </div>
      <div className="rounded-2xl border border-stone-200/80 bg-white p-6 shadow-sm">
        <div className="space-y-3">
          <div className="shimmer h-5 w-1/3 rounded" />
          <div className="shimmer h-4 w-1/2 rounded" />
        </div>
      </div>
    </div>
  );
}
