import Link from "next/link";

import { SignUpForm } from "./sign-up-form";

export const metadata = {
  title: "Sign up — HomeMade",
};

export default function SignUpPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-50 px-5 py-10">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-stone-200/80 bg-white p-8 shadow-sm">
          <Link
            href="/"
            className="text-sm text-stone-400 transition hover:text-amber-700"
          >
            &larr; Back
          </Link>
          <h1 className="mt-6 text-3xl font-bold text-stone-900">
            Join HomeMade
          </h1>
          <p className="mt-2 text-stone-500">
            Real food, made by real people in real kitchens.
          </p>

          <SignUpForm />
        </div>

        <p className="mt-6 text-center text-sm text-stone-500">
          Already have an account?{" "}
          <Link
            href="/sign-in"
            className="font-semibold text-amber-700 hover:text-amber-800"
          >
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
