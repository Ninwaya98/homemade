"use client";

export default function CustomerError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-md px-5 py-16 text-center">
      <div className="glass-strong rounded-2xl p-8">
        <h2 className="text-lg font-bold text-stone-900">Something went wrong</h2>
        <p className="mt-2 text-sm text-stone-500">
          We couldn&apos;t load this page. Please try again.
        </p>
        <button
          onClick={reset}
          className="mt-4 gradient-purple rounded-full px-5 py-2 text-sm font-semibold text-white shadow-sm"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
