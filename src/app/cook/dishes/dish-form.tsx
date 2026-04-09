"use client";

import { useActionState } from "react";

import { createDish, updateDish, type DishFormState } from "@/app/cook/actions";
import { Button } from "@/components/ui/Button";
import { Field, TextareaField } from "@/components/ui/Field";
import { Card } from "@/components/ui/Card";
import { AllergenChecklist } from "@/components/ui/AllergenChecklist";
import { CUISINES } from "@/lib/constants";

const initial: DishFormState = undefined;

type DishDefaults = {
  name: string;
  description: string;
  price: number;
  portion_size: string;
  cuisine_tag: string;
  allergens: string[];
  photo_url: string | null;
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
            placeholder="Stuffed grape leaves with rice, herbs, and pomegranate molasses…"
          />
          <div className="grid gap-5 sm:grid-cols-3">
            <Field
              label="Price (USD)"
              name="price"
              type="number"
              step="0.01"
              min="0.01"
              required
              defaultValue={defaultValues?.price}
            />
            <Field
              label="Portion size"
              name="portion_size"
              type="text"
              defaultValue={defaultValues?.portion_size}
              placeholder="1 plate"
            />
            <div>
              <label className="block text-sm font-medium text-stone-700">
                Cuisine tag
              </label>
              <select
                name="cuisine_tag"
                defaultValue={defaultValues?.cuisine_tag ?? ""}
                className="mt-1 block w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-base text-stone-900 shadow-sm outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200"
              >
                <option value="">—</option>
                {CUISINES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </Card>

      <AllergenChecklist defaultAllergens={defaultValues?.allergens ?? []} />

      <Card>
        <h3 className="text-sm font-semibold text-stone-900">Photo</h3>
        <p className="mt-1 text-xs text-stone-500">
          A good photo doubles orders. Square or landscape, &lt; 5 MB.
        </p>
        <div className="mt-4 flex items-center gap-4">
          {defaultValues?.photo_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={defaultValues.photo_url}
              alt=""
              className="h-20 w-20 rounded-lg object-cover"
            />
          )}
          <input
            type="file"
            name="photo"
            accept="image/jpeg,image/png,image/webp"
            className="block w-full text-sm text-stone-700 file:mr-4 file:rounded-full file:border-0 file:bg-stone-200 file:px-4 file:py-2 file:text-sm file:font-medium file:text-stone-900 hover:file:bg-stone-300"
          />
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
          {pending ? "Saving…" : mode === "create" ? "Create dish" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
