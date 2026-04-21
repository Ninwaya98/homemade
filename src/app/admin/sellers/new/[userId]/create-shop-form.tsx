"use client";

import { useActionState } from "react";
import { createSellerForUser, type CreateSellerForUserState } from "@/app/admin/actions";
import { PRODUCT_CATEGORIES } from "@/lib/constants";
import { Card } from "@/components/ui/Card";
import { Field, TextareaField } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

const initial: CreateSellerForUserState = undefined;

export function CreateShopForm({
  userId,
  ownerName,
  initialPhone,
  initialLocation,
}: {
  userId: string;
  ownerName: string;
  initialPhone: string;
  initialLocation: string;
}) {
  const action = createSellerForUser.bind(null, userId);
  const [state, formAction, pending] = useActionState(action, initial);

  return (
    <form action={formAction} className="space-y-6">
      <Card>
        <h2 className="text-base font-semibold text-stone-900">Shop details</h2>
        <p className="mt-1 text-xs text-stone-500">Owner: {ownerName}</p>
        <div className="mt-5 space-y-5">
          <Field
            label="Shop name"
            name="shop_name"
            type="text"
            defaultValue={state?.fields?.shop_name ?? ""}
            placeholder="e.g. Amina's Ceramics"
            required
          />
          <TextareaField
            label="Shop description"
            name="shop_description"
            defaultValue={state?.fields?.shop_description ?? ""}
            rows={3}
            placeholder="What does this shop sell and what makes it special?"
            required
          />
          <div>
            <label className="block text-sm font-medium text-stone-700">
              Category <span className="ml-1 text-violet-600">*</span>
            </label>
            <select
              name="category"
              defaultValue={state?.fields?.category ?? ""}
              required
              className="mt-1 block w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-base text-stone-900 outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-200"
            >
              <option value="">Select…</option>
              {PRODUCT_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-base font-semibold text-stone-900">Contact</h2>
        <p className="mt-1 text-xs text-stone-500">
          These go on the owner&apos;s profile and are shown to customers who order.
        </p>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <Field
            label="Phone"
            name="phone"
            type="tel"
            defaultValue={state?.fields?.phone ?? initialPhone}
            placeholder="+964 …"
            required
          />
          <Field
            label="Location"
            name="location"
            type="text"
            defaultValue={state?.fields?.location ?? initialLocation}
            placeholder="Erbil, Iraq"
            required
          />
        </div>
      </Card>

      {state?.error && (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"
        >
          {state.error}
        </p>
      )}

      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Creating shop…" : "Create shop"}
        </Button>
      </div>
    </form>
  );
}
