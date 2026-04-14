"use client";

import { useState } from "react";
import { useActionState } from "react";

import { createDish, updateDish, type DishFormState } from "@/app/cook/actions";
import { Button } from "@/components/ui/Button";
import { Field, TextareaField } from "@/components/ui/Field";
import { Card } from "@/components/ui/Card";
import { AllergenChecklist } from "@/components/ui/AllergenChecklist";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { CUISINES, PORTION_SIZES, formatPrice } from "@/lib/constants";
import type { DishPortionSizes } from "@/lib/types";

const initial: DishFormState = undefined;

type DishDefaults = {
  name: string;
  description: string;
  cuisine_tag: string;
  allergens: string[];
  photo_url: string | null;
  portion_sizes: DishPortionSizes | null;
  legacy_price: number | null;
};

export function DishForm({
  mode,
  dishId,
  defaultValues,
}: {
  mode: "create" | "edit";
  dishId?: string;
  defaultValues?: DishDefaults;
}) {
  const action =
    mode === "create"
      ? createDish
      : updateDish.bind(null, dishId!);
  const [state, formAction, pending] = useActionState(action, initial);

  // Initialize portion size enabled/price state from defaults
  const ps = defaultValues?.portion_sizes;
  const legacyPrice = defaultValues?.legacy_price;

  const [enabledSizes, setEnabledSizes] = useState<Record<string, boolean>>(() => {
    if (ps) {
      return {
        small: !!ps.small,
        medium: !!ps.medium,
        large: !!ps.large,
      };
    }
    // New dish: enable all three by default
    if (mode === "create") {
      return { small: true, medium: true, large: true };
    }
    // Legacy dish being edited: pre-fill medium
    return { small: false, medium: true, large: false };
  });

  const [prices, setPrices] = useState<Record<string, string>>(() => {
    if (ps) {
      return {
        small: ps.small ? (ps.small.price_cents / 100).toFixed(2) : "",
        medium: ps.medium ? (ps.medium.price_cents / 100).toFixed(2) : "",
        large: ps.large ? (ps.large.price_cents / 100).toFixed(2) : "",
      };
    }
    // Legacy dish: pre-fill medium with existing price
    if (legacyPrice && legacyPrice > 0) {
      return {
        small: "",
        medium: legacyPrice.toFixed(2),
        large: "",
      };
    }
    return { small: "", medium: "", large: "" };
  });

  function toggleSize(id: string) {
    setEnabledSizes((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function setPrice(id: string, val: string) {
    setPrices((prev) => ({ ...prev, [id]: val }));
  }

  // Compute a preview total for the cheapest size
  const enabledPrices = PORTION_SIZES
    .filter((s) => enabledSizes[s.id] && prices[s.id])
    .map((s) => Number(prices[s.id]) * 100)
    .filter((p) => p > 0);
  const cheapest = enabledPrices.length > 0 ? Math.min(...enabledPrices) : 0;

  return (
    <form action={formAction} className="space-y-5">
      <Card>
        <div className="space-y-5">
          <Field
            label="Dish name"
            name="name"
            type="text"
            required
            defaultValue={defaultValues?.name}
            placeholder="Iraqi dolma"
          />
          <TextareaField
            label="Description"
            name="description"
            rows={4}
            defaultValue={defaultValues?.description}
            placeholder="Stuffed grape leaves with rice, herbs, and pomegranate molasses..."
          />
          <div>
            <label className="block text-sm font-medium text-stone-700">
              Cuisine tag
            </label>
            <select
              name="cuisine_tag"
              defaultValue={defaultValues?.cuisine_tag ?? ""}
              className="mt-1 block w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-base text-stone-900 shadow-sm outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-200"
            >
              <option value="">--</option>
              {CUISINES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Portion sizes & pricing */}
      <Card>
        <h3 className="text-sm font-semibold text-stone-900">
          Portion sizes & pricing
        </h3>
        <p className="mt-1 text-xs text-stone-500">
          Set a price for each size you offer. Enable at least one.
        </p>
        <div className="mt-4 space-y-3">
          {PORTION_SIZES.map((size) => (
            <div
              key={size.id}
              className={`flex items-center gap-4 rounded-xl border p-3 transition-colors ${
                enabledSizes[size.id]
                  ? "border-violet-200 bg-violet-50/50"
                  : "border-stone-200 bg-stone-50/50 opacity-60"
              }`}
            >
              <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-stone-800">
                <input
                  type="checkbox"
                  checked={enabledSizes[size.id]}
                  onChange={() => toggleSize(size.id)}
                  className="h-4 w-4 rounded border-stone-300 text-violet-600 focus:ring-violet-500"
                />
                <span className="min-w-[60px] font-semibold">{size.label}</span>
              </label>
              <span className="hidden text-xs text-stone-500 sm:inline">
                {size.servesLabel} &middot; uses {size.portions} portion{size.portions > 1 ? "s" : ""}
              </span>
              <div className="ml-auto flex items-center gap-1.5">
                <span className="text-sm text-stone-500">$</span>
                <input
                  type="number"
                  name={`price_${size.id}`}
                  step="0.01"
                  min="0.01"
                  value={enabledSizes[size.id] ? prices[size.id] : ""}
                  onChange={(e) => setPrice(size.id, e.target.value)}
                  disabled={!enabledSizes[size.id]}
                  placeholder="0.00"
                  className="w-24 rounded-lg border border-stone-300 bg-white px-2.5 py-1.5 text-right text-sm text-stone-900 shadow-sm outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-200 disabled:bg-stone-100 disabled:text-stone-400"
                />
              </div>
            </div>
          ))}
        </div>
        {cheapest > 0 && (
          <p className="mt-3 text-xs text-stone-500">
            Customers will see: <strong className="text-violet-600">from {formatPrice(cheapest)}</strong>
          </p>
        )}
      </Card>

      <AllergenChecklist defaultAllergens={defaultValues?.allergens ?? []} />

      <Card>
        <h3 className="text-sm font-semibold text-stone-900">Photo</h3>
        <p className="mt-1 text-xs text-stone-500">
          A good photo doubles orders. Any format — auto-cropped to square.
        </p>
        <div className="mt-4">
          <ImageUpload name="photo" existingUrl={defaultValues?.photo_url} />
        </div>
      </Card>

      {state?.error && (
        <p
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {state.error}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Saving..." : mode === "create" ? "Create dish" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
