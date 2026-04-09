"use client";

import { useState } from "react";

import { ALLERGENS, type AllergenId } from "@/lib/constants";

/**
 * Mandatory allergen declaration checklist used in dish creation and
 * cook onboarding. The hidden input named `allergens` carries the
 * comma-separated values to the server action.
 *
 * The brief says the allergen checklist must be completed before a
 * dish can be saved. We enforce this with a "no allergens declared"
 * checkbox — the user must EITHER pick at least one allergen OR tick
 * "I confirm this dish contains none of the listed allergens", but
 * cannot leave both empty. The server action also re-validates.
 */
export function AllergenChecklist({
  defaultAllergens = [],
  name = "allergens",
}: {
  defaultAllergens?: string[];
  name?: string;
}) {
  const [selected, setSelected] = useState<Set<string>>(
    new Set(defaultAllergens),
  );
  const [confirmedNone, setConfirmedNone] = useState(
    defaultAllergens.length === 0 ? false : false,
  );

  const toggle = (id: AllergenId) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else {
      next.add(id);
      setConfirmedNone(false);
    }
    setSelected(next);
  };

  return (
    <fieldset className="rounded-xl border border-stone-200 bg-stone-50 p-4">
      <legend className="px-1 text-sm font-medium text-stone-800">
        Allergens <span className="text-amber-700">*</span>
      </legend>
      <p className="mt-1 text-xs text-stone-600">
        Tick every allergen this dish contains. Customers see this on
        the dish card AND again at checkout.
      </p>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {ALLERGENS.map((a) => {
          const checked = selected.has(a.id);
          return (
            <button
              key={a.id}
              type="button"
              onClick={() => toggle(a.id)}
              aria-pressed={checked}
              className={`rounded-lg border-2 px-3 py-2 text-left text-sm transition ${
                checked
                  ? "border-amber-700 bg-amber-50 text-amber-900"
                  : "border-stone-200 bg-white text-stone-700 hover:border-stone-300"
              }`}
            >
              {a.label}
            </button>
          );
        })}
      </div>

      <label className="mt-4 flex cursor-pointer items-start gap-2 text-sm text-stone-700">
        <input
          type="checkbox"
          checked={confirmedNone}
          onChange={(e) => {
            setConfirmedNone(e.target.checked);
            if (e.target.checked) setSelected(new Set());
          }}
          className="mt-0.5 h-4 w-4 rounded border-stone-400 text-amber-700 focus:ring-amber-500"
        />
        <span>
          I confirm this dish contains <strong>none</strong> of the listed
          allergens.
        </span>
      </label>

      <input
        type="hidden"
        name={name}
        value={Array.from(selected).join(",")}
      />
      <input
        type="hidden"
        name={`${name}_confirmed_none`}
        value={confirmedNone ? "1" : "0"}
      />
    </fieldset>
  );
}
