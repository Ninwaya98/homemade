import Link from "next/link";

import { SignUpForm } from "./sign-up-form";

export const metadata = {
  title: "Sign up — Authentic Kitchen",
};

export default function SignUpPage() {
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
          Join Authentic Kitchen
        </h1>
        <p className="mt-2 text-stone-600">
          Real food, made by real people in real kitchens.
        </p>

        <SignUpForm />

        <p className="mt-8 text-center text-sm text-stone-600">
          Already have an account?{" "}
          <Link
            href="/sign-in"
            className="font-medium text-amber-700 hover:text-amber-800"
          >
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
