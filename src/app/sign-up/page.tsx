import Link from "next/link";

import { SignUpForm } from "./sign-up-form";

export const metadata = {
  title: "Sign up — HomeMade",
};

export default function SignUpPage() {
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
            className="font-semibold text-violet-600 hover:text-violet-700"
          >
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
