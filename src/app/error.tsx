"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center gradient-mesh px-5">
      <div className="mx-auto max-w-md text-center">
        <h1 className="text-2xl font-semibold text-stone-900">
          Something went wrong
        </h1>
        <p className="mt-3 text-stone-600">
          An unexpected error occurred. Please try again.
        </p>
        <button
          onClick={reset}
          className="mt-6 inline-flex items-center justify-center rounded-full gradient-purple px-6 py-3 text-base font-medium text-white shadow-lg shadow-violet-500/25 transition hover:shadow-xl"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
