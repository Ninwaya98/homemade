"use client";

import { useActionState } from "react";

import { submitSellerOnboarding, type OnboardingState } from "@/app/seller/actions";
import { Button } from "@/components/ui/Button";
import { Field, TextareaField } from "@/components/ui/Field";
import { Card } from "@/components/ui/Card";
import { PRODUCT_CATEGORIES } from "@/lib/constants";

const initial: OnboardingState = undefined;

export function SellerOnboardingForm({
  defaultShopName,
  defaultShopDescription,
  defaultCategory,
  defaultPhone,
  defaultLocation,
  currentPhotoUrl,
}: {
  defaultShopName: string;
  defaultShopDescription: string;
  defaultCategory: string;
  defaultPhone: string;
  defaultLocation: string;
  currentPhotoUrl: string | null;
}) {
  const [state, action, pending] = useActionState(submitSellerOnboarding, initial);

  return (
    <form action={action} className="space-y-6">
      <Card>
        <h2 className="text-base font-semibold text-stone-900">Your shop</h2>
        <p className="mt-1 text-sm text-stone-600">
          This is what customers see when they visit your shop page.
        </p>
        <div className="mt-5 space-y-5">
          <Field
            label="Shop name"
            name="shop_name"
            type="text"
            defaultValue={defaultShopName}
            placeholder="e.g. Noor's Handmade Pottery"
            required
          />
          <TextareaField
            label="About your shop"
            name="shop_description"
            defaultValue={defaultShopDescription}
            rows={5}
            placeholder="Tell customers what you make, your inspiration, your story…"
            required
            hint="At least 20 characters. Customers love a real story."
          />
          <div>
            <label className="block text-sm font-medium text-stone-700">
              Primary category <span className="ml-1 text-amber-700">*</span>
            </label>
            <select
              name="category"
              defaultValue={defaultCategory}
              required
              className="mt-1 block w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-base text-stone-900 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200"
            >
              <option value="">Select a category…</option>
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
        <h2 className="text-base font-semibold text-stone-900">How customers reach you</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <Field
            label="Phone"
            name="phone"
            type="tel"
            defaultValue={defaultPhone}
            placeholder="+964 …"
            required
          />
          <Field
            label="Location"
            name="location"
            type="text"
            defaultValue={defaultLocation}
            placeholder="Karrada, Baghdad"
            required
          />
        </div>
      </Card>

      <Card>
        <h2 className="text-base font-semibold text-stone-900">Shop photo (optional)</h2>
        <p className="mt-1 text-sm text-stone-600">
          A photo of you or your workspace helps customers connect with your story.
        </p>
        <div className="mt-5 flex items-center gap-4">
          {currentPhotoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={currentPhotoUrl}
              alt=""
              className="h-16 w-16 rounded-2xl object-cover"
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
          className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"
        >
          {state.error}
        </p>
      )}

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
        <strong>What happens next:</strong> we&apos;ll review your shop and
        approve it within 1–2 days. Once live, you can add products and
        start selling.
      </div>

      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Submitting…" : "Submit for review"}
        </Button>
      </div>
    </form>
  );
}
