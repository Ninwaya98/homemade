"use client";

import { useTransition } from "react";
import { toggleAvailability } from "@/app/cook/actions";

export function AvailabilityToggle({ isAvailable }: { isAvailable: boolean }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => toggleAvailability())}
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
        isAvailable
          ? "border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
          : "border border-red-200 bg-red-50 text-red-800 hover:bg-red-100"
      } ${pending ? "opacity-50" : ""}`}
    >
      <span
        className={`inline-block h-2.5 w-2.5 rounded-full ${
          isAvailable ? "bg-emerald-500" : "bg-red-500"
        }`}
      />
      {pending
        ? "Updating..."
        : isAvailable
        ? "Available"
        : "Not available"}
    </button>
  );
}
