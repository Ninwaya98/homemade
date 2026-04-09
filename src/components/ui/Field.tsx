import type { ComponentProps, ReactNode } from "react";

type FieldProps = {
  label: string;
  hint?: ReactNode;
  error?: string;
} & Omit<ComponentProps<"input">, "className">;

export function Field({
  label,
  hint,
  error,
  id,
  name,
  required,
  ...rest
}: FieldProps) {
  const fieldId = id ?? name;
  return (
    <div>
      <label htmlFor={fieldId} className="block text-sm font-medium text-stone-700">
        {label}
        {required && <span className="ml-1 text-amber-700">*</span>}
      </label>
      <input
        id={fieldId}
        name={name}
        required={required}
        {...rest}
        className={`mt-1 block w-full rounded-lg border px-3 py-2.5 text-base text-stone-900 shadow-sm outline-none focus:ring-2 focus:ring-amber-200 ${
          error
            ? "border-red-400 focus:border-red-500 bg-red-50"
            : "border-stone-300 focus:border-amber-600 bg-white"
        }`}
      />
      {hint && !error && <p className="mt-1 text-xs text-stone-500">{hint}</p>}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

type TextareaProps = {
  label: string;
  hint?: ReactNode;
  error?: string;
} & Omit<ComponentProps<"textarea">, "className">;

export function TextareaField({
  label,
  hint,
  error,
  id,
  name,
  required,
  rows = 4,
  ...rest
}: TextareaProps) {
  const fieldId = id ?? name;
  return (
    <div>
      <label htmlFor={fieldId} className="block text-sm font-medium text-stone-700">
        {label}
        {required && <span className="ml-1 text-amber-700">*</span>}
      </label>
      <textarea
        id={fieldId}
        name={name}
        rows={rows}
        required={required}
        {...rest}
        className={`mt-1 block w-full rounded-lg border px-3 py-2.5 text-base text-stone-900 shadow-sm outline-none focus:ring-2 focus:ring-amber-200 ${
          error
            ? "border-red-400 focus:border-red-500 bg-red-50"
            : "border-stone-300 focus:border-amber-600 bg-white"
        }`}
      />
      {hint && !error && <p className="mt-1 text-xs text-stone-500">{hint}</p>}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
