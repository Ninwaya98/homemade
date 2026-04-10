export default function RootLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-stone-200 border-t-violet-600" />
        <p className="text-xs text-stone-400">Loading...</p>
      </div>
    </div>
  );
}
