"use client";

import { useActionState, useState } from "react";
import Image from "next/image";

import { placeProductOrder, type ProductOrderFormState } from "@/app/customer/actions";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  formatPrice,
  splitOrderTotal,
  productCategoryLabel,
} from "@/lib/constants";

const initial: ProductOrderFormState = undefined;

type Product = {
  id: string;
  name: string;
  description: string | null;
  photo_urls: string[];
  price_cents: number;
  stock_quantity: number;
  category: string;
  materials: string | null;
  dimensions: string | null;
  condition: string;
  ingredients: string | null;
};

type Seller = {
  shop_name: string;
  full_name: string;
  location: string | null;
  photo_url: string | null;
};

export function ProductOrderForm({
  product,
  seller,
}: {
  product: Product;
  seller: Seller;
}) {
  const [state, formAction, pending] = useActionState(placeProductOrder, initial);
  const [step, setStep] = useState<"choose" | "ingredients" | "checkout">(
    product.category === "food_products" && product.ingredients ? "choose" : "choose",
  );
  const [quantity, setQuantity] = useState(1);
  const [type, setType] = useState<"pickup" | "delivery">("pickup");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [ingredientAck, setIngredientAck] = useState(false);

  const total = product.price_cents * quantity;
  const { commission, payout } = splitOrderTotal(total);
  const isFoodProduct = product.category === "food_products" && product.ingredients;
  const maxQty = Math.min(20, product.stock_quantity);

  // Step labels for progress
  const steps = isFoodProduct
    ? ["Choose", "Ingredients", "Checkout"] as const
    : ["Choose", "Checkout"] as const;
  const stepIndex = step === "choose" ? 0 : step === "ingredients" ? 1 : steps.length - 1;

  return (
    <div className="space-y-5">
      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition ${
                  i < stepIndex
                    ? "bg-emerald-500 text-white"
                    : i === stepIndex
                    ? "bg-violet-600 text-white shadow-sm shadow-violet-600/30"
                    : "bg-stone-200 text-stone-500"
                }`}
              >
                {i < stepIndex ? "✓" : i + 1}
              </div>
              <span className={`text-xs font-medium ${i === stepIndex ? "text-violet-700" : "text-stone-400"}`}>
                {s}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`h-0.5 w-6 rounded-full ${i < stepIndex ? "bg-emerald-400" : "bg-stone-200"}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1 — Choose */}
      {step === "choose" && (
        <>
          <Card>
            <div className="flex items-start gap-4">
              {product.photo_urls.length > 0 ? (
                <div className="flex gap-2 overflow-x-auto">
                  {product.photo_urls.slice(0, 3).map((url, i) => (
                    <Image
                      key={i}
                      src={url}
                      alt=""
                      width={i === 0 ? 96 : 80}
                      height={96}
                      className={`flex-none rounded-xl object-cover shadow-sm ${i === 0 ? "h-24 w-24" : "h-24 w-20"}`}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex h-24 w-24 flex-none items-center justify-center rounded-xl bg-stone-100 text-3xl">🛍</div>
              )}
              <div className="min-w-0 flex-1">
                <h1 className="text-xl font-bold text-stone-900">{product.name}</h1>
                <p className="text-sm font-semibold text-violet-600">{formatPrice(product.price_cents)}</p>
                <p className="text-xs text-stone-500">
                  from {seller.shop_name} {seller.location && `· ${seller.location}`}
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  <Badge tone="neutral">{productCategoryLabel(product.category)}</Badge>
                  <Badge tone="neutral">{product.condition}</Badge>
                </div>
                {product.description && (
                  <p className="mt-2 text-sm leading-relaxed text-stone-600">{product.description}</p>
                )}
              </div>
            </div>
            {(product.materials || product.dimensions) && (
              <div className="mt-4 flex flex-wrap gap-4 text-xs text-stone-500">
                {product.materials && <span>Materials: {product.materials}</span>}
                {product.dimensions && <span>Dimensions: {product.dimensions}</span>}
              </div>
            )}
          </Card>

          <Card>
            <h2 className="text-sm font-bold text-stone-900">Quantity & delivery</h2>
            <div className="mt-3 flex items-center gap-1">
              <span className="mr-2 text-sm text-stone-600">Qty</span>
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-stone-300 bg-white text-lg font-medium text-stone-700 transition hover:border-violet-400 hover:bg-violet-50 active:scale-95"
              >
                −
              </button>
              <span className="w-10 text-center text-lg font-bold text-stone-900">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity(Math.min(maxQty, quantity + 1))}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-stone-300 bg-white text-lg font-medium text-stone-700 transition hover:border-violet-400 hover:bg-violet-50 active:scale-95"
              >
                +
              </button>
              <span className="ml-3 text-sm font-medium text-violet-600">{formatPrice(total)}</span>
            </div>
            <p className="mt-1 text-xs text-stone-400">{product.stock_quantity} in stock</p>

            <div className="mt-4">
              <span className="block text-sm text-stone-600">How will you receive it?</span>
              <div className="mt-2 inline-flex rounded-full border border-stone-200 bg-stone-50 p-1 text-sm">
                <button
                  type="button"
                  onClick={() => setType("pickup")}
                  className={`rounded-full px-4 py-1.5 font-medium transition ${
                    type === "pickup" ? "bg-violet-600 text-white shadow-sm" : "text-stone-600 hover:text-stone-900"
                  }`}
                >
                  Pickup
                </button>
                <button
                  type="button"
                  onClick={() => setType("delivery")}
                  className={`rounded-full px-4 py-1.5 font-medium transition ${
                    type === "delivery" ? "bg-violet-600 text-white shadow-sm" : "text-stone-600 hover:text-stone-900"
                  }`}
                >
                  Delivery
                </button>
              </div>
            </div>

            {type === "delivery" && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-stone-700">Delivery address</label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={2}
                  required
                  placeholder="Street, building, floor, apartment…"
                  className="mt-1 block w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-base text-stone-900 outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-200"
                />
              </div>
            )}
          </Card>

          <Button
            type="button"
            size="lg"
            fullWidth
            disabled={quantity < 1 || quantity > maxQty || (type === "delivery" && !address.trim())}
            onClick={() => setStep(isFoodProduct ? "ingredients" : "checkout")}
          >
            Continue
          </Button>
        </>
      )}

      {/* Step 2 — Ingredients (food products only) */}
      {step === "ingredients" && (
        <>
          <Card className="border-violet-200">
            <h2 className="text-lg font-bold text-stone-900">Ingredients check</h2>
            <p className="mt-1 text-sm text-stone-500">
              This is a packaged food product. Please review the ingredients.
            </p>
            <div className="mt-4 rounded-xl border border-violet-200 bg-violet-50 p-4">
              <p className="text-sm font-semibold text-violet-900">Ingredients:</p>
              <p className="mt-1 text-sm text-violet-900">{product.ingredients}</p>
            </div>
            <label className="mt-4 flex cursor-pointer items-start gap-2.5 text-sm text-stone-700">
              <input
                type="checkbox"
                checked={ingredientAck}
                onChange={(e) => setIngredientAck(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-stone-400 text-violet-600 focus:ring-violet-500"
              />
              <span>I have reviewed the ingredients and understand what this product contains.</span>
            </label>
          </Card>
          <div className="flex gap-2">
            <Button type="button" variant="secondary" size="lg" onClick={() => setStep("choose")}>
              Back
            </Button>
            <Button
              type="button"
              size="lg"
              fullWidth
              disabled={!ingredientAck}
              onClick={() => setStep("checkout")}
            >
              Continue to checkout
            </Button>
          </div>
        </>
      )}

      {/* Checkout */}
      {step === "checkout" && (
        <form action={formAction} className="space-y-5">
          <input type="hidden" name="product_id" value={product.id} />
          <input type="hidden" name="quantity" value={quantity} />
          <input type="hidden" name="type" value={type} />
          {type === "delivery" && <input type="hidden" name="delivery_address" value={address} />}

          <Card>
            <h2 className="text-lg font-bold text-stone-900">Order summary</h2>
            <div className="mt-4 space-y-2.5 text-sm">
              <Row label={`${product.name} × ${quantity}`} value={formatPrice(total)} />
              <Row label="Type" value={type === "pickup" ? "Pickup" : "Delivery"} />
              {type === "delivery" && address && <Row label="Deliver to" value={address} />}
              <hr className="my-3 border-stone-100" />
              <Row label="Total" value={formatPrice(total)} bold />
              <p className="text-[11px] text-stone-400">
                Includes a {Math.round((commission / total) * 100)}% platform fee
                ({formatPrice(commission)}). Seller receives {formatPrice(payout)}.
              </p>
            </div>
          </Card>

          <Card>
            <label className="block text-sm font-medium text-stone-700">
              Notes for the seller (optional)
            </label>
            <textarea
              name="notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special requests…"
              className="mt-1 block w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-base text-stone-900 outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-200"
            />
          </Card>

          <Card className="border-dashed border-stone-300 bg-stone-50">
            <p className="text-xs text-stone-500">
              <strong>Payment:</strong> Stripe Connect isn&apos;t wired up in this MVP yet. Your
              order will be created as if paid.
            </p>
          </Card>

          {state?.error && (
            <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
              {state.error}
            </p>
          )}

          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              size="lg"
              onClick={() => setStep(isFoodProduct ? "ingredients" : "choose")}
            >
              Back
            </Button>
            <Button type="submit" size="lg" fullWidth disabled={pending}>
              {pending ? "Placing…" : `Place order · ${formatPrice(total)}`}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between gap-4 ${bold ? "font-semibold text-stone-900" : "text-stone-700"}`}>
      <span>{label}</span>
      <span className="text-right">{value}</span>
    </div>
  );
}
