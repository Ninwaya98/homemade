"use client";

import { useActionState } from "react";

import { signUp, type AuthFormState } from "@/app/actions/auth";

const initialState: AuthFormState = undefined;

export function SignUpForm() {
  const [state, action, pending] = useActionState(signUp, initialState);

  return (
    <form action={action} className="mt-8 space-y-5">
      <Field
        name="full_name"
        label="Full name"
        type="text"
        autoComplete="name"
        defaultValue={state?.fields?.full_name}
        required
      />
      <Field
        name="email"
        label="Email"
        type="email"
        autoComplete="email"
        defaultValue={state?.fields?.email}
        required
      />
      <Field
        name="password"
        label="Password"
        type="password"
        autoComplete="new-password"
        required
        hint="At least 8 characters."
      />

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
        {pending ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}

function Field({
  name,
  label,
  type,
  autoComplete,
  defaultValue,
  required,
  hint,
}: {
  name: string;
  label: string;
  type: string;
  autoComplete?: string;
  defaultValue?: string;
  required?: boolean;
  hint?: string;
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="block text-sm font-medium text-stone-700"
      >
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        autoComplete={autoComplete}
        defaultValue={defaultValue}
        required={required}
        className="mt-1 block w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-base text-stone-900 shadow-sm outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-200"
      />
      {hint && <p className="mt-1 text-xs text-stone-500">{hint}</p>}
    </div>
  );
}
