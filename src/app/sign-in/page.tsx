import Link from "next/link";

import { SignInForm } from "./sign-in-form";

export const metadata = {
  title: "Sign in — Authentic Kitchen",
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <main className="min-h-screen bg-stone-50 px-5 py-10">
      <div className="mx-auto max-w-md">
        <Link
          href="/"
          className="text-sm text-stone-500 hover:text-stone-800"
        >
          ← Back
        </Link>
        <h1 className="mt-6 text-3xl font-semibold text-stone-900">
          Welcome back
        </h1>
        <p className="mt-2 text-stone-600">
          Sign in to keep cooking — or to keep eating well.
        </p>

        <SignInForm next={next} />

        <p className="mt-8 text-center text-sm text-stone-600">
          New here?{" "}
          <Link
            href="/sign-up"
            className="font-medium text-amber-700 hover:text-amber-800"
          >
            Create an account
          </Link>
        </p>
      </div>
    </main>
  );
}
