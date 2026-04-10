"use client";

import { useActionState, useState } from "react";

import { createProduct, updateProduct, type ProductFormState } from "@/app/seller/actions";
import { Button } from "@/components/ui/Button";
import { Field, TextareaField } from "@/components/ui/Field";
import { Card } from "@/components/ui/Card";
import { PRODUCT_CATEGORIES, PRODUCT_CONDITIONS } from "@/lib/constants";

const initial: ProductFormState = undefined;

type ProductData = {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  category: string;
  subcategory: string | null;
  materials: string | null;
  dimensions: string | null;
  condition: string;
  stock_quantity: number;
  photo_urls: string[];
  ingredients: string | null;
};

export function ProductForm({
  mode,
  product,
  defaultCategory,
}: {
  mode: "create" | "edit";
  product?: ProductData;
  defaultCategory?: string;
}) {
  const boundAction = mode === "edit" && product
    ? updateProduct.bind(null, product.id)
    : createProduct;
  const [state, action, pending] = useActionState(boundAction, initial);
  const [category, setCategory] = useState(product?.category ?? defaultCategory ?? "");
  const [retainedPhotos, setRetainedPhotos] = useState<string[]>(product?.photo_urls ?? []);

  const removePhoto = (url: string) => {
    setRetainedPhotos((prev) => prev.filter((u) => u !== url));
  };

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="retained_photo_urls" value={retainedPhotos.join(",")} />

      <Card>
        <h2 className="text-base font-semibold text-stone-900">Product details</h2>
        <div className="mt-5 space-y-5">
          <Field
            label="Product name"
            name="name"
            type="text"
            defaultValue={product?.name}
            placeholder="e.g. Hand-painted ceramic bowl"
            required
          />
          <TextareaField
            label="Description"
            name="description"
            defaultValue={product?.description ?? ""}
            rows={4}
            placeholder="Tell customers about this product — what makes it special?"
          />
          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              label="Price ($)"
              name="price"
              type="number"
              defaultValue={product ? String(product.price_cents / 100) : ""}
              placeholder="0.00"
              required
            />
            <Field
              label="Stock quantity"
              name="stock_quantity"
              type="number"
              defaultValue={product ? String(product.stock_quantity) : "1"}
              placeholder="1"
              required
            />
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-base font-semibold text-stone-900">Category & details</h2>
        <div className="mt-5 space-y-5">
          <div>
            <label className="block text-sm font-medium text-stone-700">
              Category <span className="ml-1 text-violet-600">*</span>
            </label>
            <select
              name="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
              className="mt-1 block w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-base text-stone-900 outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-200"
            >
              <option value="">Select…</option>
              {PRODUCT_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </div>
          <Field
            label="Subcategory"
            name="subcategory"
            type="text"
            defaultValue={product?.subcategory ?? ""}
            placeholder="e.g. Pottery, Scarves, Candles"
            hint="A more specific label within your category"
          />
          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              label="Materials"
              name="materials"
              type="text"
              defaultValue={product?.materials ?? ""}
              placeholder="e.g. Ceramic, cotton, wood"
            />
            <Field
              label="Dimensions"
              name="dimensions"
              type="text"
              defaultValue={product?.dimensions ?? ""}
              placeholder="e.g. 10cm × 15cm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700">Condition</label>
            <select
              name="condition"
              defaultValue={product?.condition ?? "handmade"}
              className="mt-1 block w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-base text-stone-900 outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-200"
            >
              {PRODUCT_CONDITIONS.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </div>

          {category === "food_products" && (
            <TextareaField
              label="Ingredients"
              name="ingredients"
              defaultValue={product?.ingredients ?? ""}
              rows={3}
              required
              placeholder="List ingredients for packaged food products"
              hint="Required for food products so customers know what's in it"
            />
          )}
        </div>
      </Card>

      <Card>
        <h2 className="text-base font-semibold text-stone-900">Photos</h2>
        <p className="mt-1 text-sm text-stone-600">
          Add up to 5 photos of your product. The first one is the main image.
        </p>

        {retainedPhotos.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {retainedPhotos.map((url) => (
              <div key={url} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt=""
                  className="h-20 w-20 rounded-lg object-cover"
                />
                <button
                  type="button"
                  onClick={() => removePhoto(url)}
                  className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4">
          <input
            type="file"
            name="photos"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="block w-full text-sm text-stone-700 file:mr-4 file:rounded-full file:border-0 file:bg-violet-600 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-violet-700"
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
          {pending ? "Saving…" : mode === "create" ? "Add product" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
