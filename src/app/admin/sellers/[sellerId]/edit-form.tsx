"use client";

import { useActionState } from "react";
import { updateSellerProfile, type AdminSellerUpdateState } from "@/app/admin/actions";
import { PRODUCT_CATEGORIES } from "@/lib/constants";

const initialState: AdminSellerUpdateState = undefined;

export function AdminSellerEditForm({
  sellerId,
  initialValues,
}: {
  sellerId: string;
  initialValues: {
    shop_name: string;
    shop_description: string;
    category: string;
    phone: string;
    location: string;
  };
}) {
  const action = updateSellerProfile.bind(null, sellerId);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="mt-4 space-y-4">
      <div>
        <label className="block text-xs font-medium text-stone-700">
          Shop name
        </label>
        <input
          name="shop_name"
          type="text"
          defaultValue={state?.fields?.shop_name ?? initialValues.shop_name}
          className="mt-1 block w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-200"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-stone-700">
          Shop description
        </label>
        <textarea
          name="shop_description"
          rows={3}
          defaultValue={state?.fields?.shop_description ?? initialValues.shop_description}
          className="mt-1 block w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-200"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-medium text-stone-700">
            Category
          </label>
          <select
            name="category"
            defaultValue={state?.fields?.category ?? initialValues.category}
            className="mt-1 block w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-200"
          >
            {PRODUCT_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-stone-700">
            Phone
          </label>
          <input
            name="phone"
            type="tel"
            defaultValue={state?.fields?.phone ?? initialValues.phone}
            className="mt-1 block w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-200"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-stone-700">
          Location
        </label>
        <input
          name="location"
          type="text"
          defaultValue={state?.fields?.location ?? initialValues.location}
          className="mt-1 block w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-200"
        />
      </div>

      {state?.error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}
      {state?.success && (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Shop updated.
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-violet-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-700 disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
