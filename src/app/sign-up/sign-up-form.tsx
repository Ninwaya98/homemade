"use client";

import { useActionState, useState } from "react";

import { signUp, type AuthFormState } from "@/app/actions/auth";
// UserRole from generated types doesn't include 'seller' yet — use string union
type UserRole = "cook" | "customer" | "seller";

const initialState: AuthFormState = undefined;

export function SignUpForm() {
  const [state, action, pending] = useActionState(signUp, initialState);
  const [role, setRole] = useState<UserRole>(
    (state?.fields?.role as UserRole | undefined) ?? "customer",
  );

  return (
    <form action={action} className="mt-8 space-y-5">
      {/* Role selector — large tap targets, mobile first */}
      <fieldset>
        <legend className="text-sm font-medium text-stone-700">
          I am a…
        </legend>
        <div className="mt-2 grid grid-cols-3 gap-3">
          <RoleOption
            value="customer"
            label="Hungry"
            hint="I want to order food & goods"
            checked={role === "customer"}
            onChange={setRole}
          />
          <RoleOption
            value="cook"
            label="Cook"
            hint="I sell homemade dishes"
            checked={role === "cook"}
            onChange={setRole}
          />
          <RoleOption
            value="seller"
            label="Seller"
            hint="I sell handmade goods"
            checked={role === "seller"}
            onChange={setRole}
          />
        </div>
        <input type="hidden" name="role" value={role} />
      </fieldset>

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
        className="w-full rounded-full bg-amber-700 px-5 py-3 text-base font-medium text-white shadow-sm transition hover:bg-amber-800 disabled:opacity-60"
      >
        {pending ? "Creating account…" : "Create account"}
      </button>

      {role === "cook" && (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          New cooks need admin approval (and a food handler certificate)
          before their dishes go live. We&apos;ll guide you after signup.
        </p>
      )}
      {role === "seller" && (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          New sellers need admin approval before their products go live.
          Set up your shop after signup and we&apos;ll review it.
        </p>
      )}
    </form>
  );
}

function RoleOption({
  value,
  label,
  hint,
  checked,
  onChange,
}: {
  value: UserRole;
  label: string;
  hint: string;
  checked: boolean;
  onChange: (role: UserRole) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(value)}
      className={`rounded-xl border-2 px-4 py-3 text-left transition ${
        checked
          ? "border-amber-700 bg-amber-50"
          : "border-stone-200 bg-white hover:border-stone-300"
      }`}
      aria-pressed={checked}
    >
      <span className="block text-base font-semibold text-stone-900">
        {label}
      </span>
      <span className="mt-0.5 block text-xs text-stone-600">{hint}</span>
    </button>
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
        className="mt-1 block w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-base text-stone-900 shadow-sm outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200"
      />
      {hint && <p className="mt-1 text-xs text-stone-500">{hint}</p>}
    </div>
  );
}
