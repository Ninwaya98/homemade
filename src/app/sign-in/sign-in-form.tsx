"use client";

import { useActionState } from "react";

import { signIn, type AuthFormState } from "@/app/actions/auth";

const initialState: AuthFormState = undefined;

export function SignInForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(signIn, initialState);

  return (
    <form action={action} className="mt-8 space-y-5">
      <input type="hidden" name="next" value={next ?? ""} />

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

      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-stone-700"
        >
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="mt-1 block w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-base text-stone-900 shadow-sm outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200"
        />
      </div>

      <div className="text-right">
        <a
          href="/forgot-password"
          className="text-sm text-amber-700 hover:text-amber-800"
        >
          Forgot password?
        </a>
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
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
