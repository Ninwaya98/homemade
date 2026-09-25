"use client";

import { useActionState } from "react";

import {
  updatePassword,
  type UpdatePasswordState,
} from "@/app/actions/auth";

const initialState: UpdatePasswordState = undefined;

const inputClass =
  "mt-1 block w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-base text-stone-900 shadow-sm outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-200";

export function ResetPasswordForm() {
  const [state, action, pending] = useActionState(updatePassword, initialState);

  return (
    <form action={action} className="mt-8 space-y-5">
      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-stone-700"
        >
          New password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          className={inputClass}
        />
      </div>
      <div>
        <label
          htmlFor="confirm"
          className="block text-sm font-medium text-stone-700"
        >
          Repeat new password
        </label>
        <input
          id="confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          className={inputClass}
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
        className="w-full rounded-full gradient-purple px-5 py-3 text-base font-medium text-white shadow-lg shadow-violet-500/25 transition hover:shadow-xl disabled:opacity-60"
      >
        {pending ? "Saving..." : "Save new password"}
      </button>
    </form>
  );
}
