"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-50 px-5">
      <div className="mx-auto max-w-md text-center">
        <h1 className="text-2xl font-semibold text-stone-900">
          Something went wrong
        </h1>
        <p className="mt-3 text-stone-600">
          An unexpected error occurred. Please try again.
        </p>
        <button
          onClick={reset}
          className="mt-6 inline-flex items-center justify-center rounded-full bg-amber-700 px-6 py-3 text-base font-medium text-white shadow-sm transition hover:bg-amber-800"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
