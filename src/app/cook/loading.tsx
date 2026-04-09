export default function CookLoading() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-stone-200" />
      <div className="rounded-2xl border border-stone-200 bg-white p-6">
        <div className="space-y-3">
          <div className="h-5 w-3/4 animate-pulse rounded bg-stone-200" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-stone-100" />
          <div className="h-4 w-2/3 animate-pulse rounded bg-stone-100" />
        </div>
      </div>
      <div className="rounded-2xl border border-stone-200 bg-white p-6">
        <div className="space-y-3">
          <div className="h-5 w-1/3 animate-pulse rounded bg-stone-200" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-stone-100" />
        </div>
      </div>
    </div>
  );
}
