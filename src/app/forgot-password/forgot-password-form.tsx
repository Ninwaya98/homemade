"use client";

import { useActionState } from "react";

import {
  resetPassword,
  type ResetPasswordState,
} from "@/app/actions/auth";

const initialState: ResetPasswordState = undefined;

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(resetPassword, initialState);

  if (state?.success) {
    return (
      <div className="mt-8 rounded-xl border border-emerald-200 bg-emerald-50 p-6">
        <h2 className="text-base font-semibold text-emerald-900">
          Check your email
        </h2>
        <p className="mt-2 text-sm text-emerald-900/80">
          If an account exists with that email, we&apos;ve sent a password
          reset link. It may take a minute to arrive.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="mt-8 space-y-5">
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-stone-700"
        >
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={state?.fields?.email}
          className="mt-1 block w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-base text-stone-900 shadow-sm outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200"
        />
      </div>

      {state?.error && (
        <p
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-amber-700 px-5 py-3 text-base font-medium text-white shadow-sm transition hover:bg-amber-800 disabled:opacity-60"
      >
        {pending ? "Sending..." : "Send reset link"}
      </button>
    </form>
  );
}
