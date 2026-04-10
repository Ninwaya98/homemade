import Link from "next/link";

export const metadata = {
  title: "Page not found — HomeMade",
};

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center gradient-mesh px-5">
      <div className="mx-auto max-w-md text-center">
        <p className="text-6xl font-semibold text-violet-600">404</p>
        <h1 className="mt-4 text-2xl font-semibold text-stone-900">
          Page not found
        </h1>
        <p className="mt-3 text-stone-600">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center justify-center rounded-full gradient-purple px-6 py-3 text-base font-medium text-white shadow-lg shadow-violet-500/25 transition hover:shadow-xl"
        >
          Back to home
        </Link>
      </div>
    </main>
  );
}
