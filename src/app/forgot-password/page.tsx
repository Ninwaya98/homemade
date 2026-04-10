import Link from "next/link";

import { ForgotPasswordForm } from "./forgot-password-form";

export const metadata = {
  title: "Reset password — HomeMade",
};

export default function ForgotPasswordPage() {
  return (
    <main className="min-h-screen bg-stone-50 px-5 py-10">
      <div className="mx-auto max-w-md">
        <Link
          href="/sign-in"
          className="text-sm text-stone-500 hover:text-stone-800"
        >
          &larr; Back to sign in
        </Link>
        <h1 className="mt-6 text-3xl font-semibold text-stone-900">
          Reset your password
        </h1>
        <p className="mt-2 text-stone-600">
          Enter the email you signed up with. We&apos;ll send you a link to
          reset your password.
        </p>

        <ForgotPasswordForm />
      </div>
    </main>
  );
}
