import Link from "next/link";

import { SignInForm } from "./sign-in-form";

export const metadata = {
  title: "Sign in — HomeMade",
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center gradient-mesh px-5 py-10">
      <div className="w-full max-w-md">
        <div className="rounded-3xl glass-strong p-8">
          <Link
            href="/"
            className="text-sm text-stone-400 transition hover:text-violet-600"
          >
            &larr; Back
          </Link>
          <h1 className="mt-6 text-3xl font-bold text-stone-900">
            Welcome back
          </h1>
          <p className="mt-2 text-stone-500">
            Sign in to browse, buy, or manage your shop.
          </p>

          <SignInForm next={next} />
        </div>

        <p className="mt-6 text-center text-sm text-stone-500">
          New here?{" "}
          <Link
            href="/sign-up"
            className="font-semibold text-violet-600 hover:text-violet-700"
          >
            Create an account
          </Link>
        </p>
      </div>
    </main>
  );
}
