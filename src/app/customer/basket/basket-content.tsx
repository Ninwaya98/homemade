"use client";

import { useEffect, useState, useActionState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { useBasket } from "@/lib/basket";
import { checkoutBasket, type CheckoutState } from "@/app/customer/actions";
import { Button, LinkButton } from "@/components/ui/Button";
import { Card, EmptyState } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  allergenLabel,
  dayLabel,
  formatPrice,
  splitOrderTotal,
} from "@/lib/constants";

const initial: CheckoutState = undefined;

export function BasketContent() {
  const { items, itemCount, totalCents, removeItem, updateQuantity, clearBasket } = useBasket();
  const router = useRouter();
  const [state, formAction, pending] = useActionState(checkoutBasket, initial);

  const [type, setType] = useState<"pickup" | "delivery">("pickup");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");

  // On successful checkout, clear basket and redirect
  useEffect(() => {
    if (state?.ok) {
      clearBasket();
      router.push(`/customer/orders?placed=${state.orderCount ?? 0}`);
    }
  }, [state, clearBasket, router]);

  if (items.length === 0) {
    return (
      <EmptyState
        title="Your basket is empty"
        body="Browse the kitchen and add some dishes!"
        action={
          <LinkButton href="/customer/kitchen">
            Browse kitchen
          </LinkButton>
        }
      />
    );
  }

  const { commission, payout } = splitOrderTotal(totalCents);
  const allAllergens = [...new Set(items.flatMap((i) => i.allergens))];

  return (
    <form action={formAction} className="space-y-5">
      {/* Serialized basket for server action */}
      <input type="hidden" name="basket_items" value={JSON.stringify(items)} />
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="allergen_ack" value="on" />
      {type === "delivery" && (
        <input type="hidden" name="delivery_address" value={address} />
      )}

      {/* Items */}
      <div className="space-y-3">
        {items.map((item) => (
          <Card key={item.id}>
            <div className="flex items-start gap-3">
              {item.photoUrl ? (
                <Image src={item.photoUrl} alt="" width={56} height={56} className="h-14 w-14 flex-none rounded-xl object-cover shadow-sm" />
              ) : (
                <div className="flex h-14 w-14 flex-none items-center justify-center rounded-xl bg-stone-100 text-xl">🍽</div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-stone-900">{item.dishName}</p>
                    <p className="text-xs text-stone-500">from {item.cookName}</p>
                  </div>
                  <p className="text-sm font-bold text-violet-600">
                    {formatPrice(item.priceCents * item.quantity)}
                  </p>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {item.portionLabel && <Badge tone="neutral">{item.portionLabel}</Badge>}
                  <Badge tone="blue">{dayLabel(item.scheduledFor)}</Badge>
                </div>

                <div className="mt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="flex h-7 w-7 items-center justify-center rounded-full border border-stone-300 bg-white text-sm font-medium text-stone-700 transition hover:border-violet-400 hover:bg-violet-50 active:scale-95"
                  >−</button>
                  <span className="w-6 text-center text-sm font-bold text-stone-900">{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="flex h-7 w-7 items-center justify-center rounded-full border border-stone-300 bg-white text-sm font-medium text-stone-700 transition hover:border-violet-400 hover:bg-violet-50 active:scale-95"
                  >+</button>
                  <span className="text-xs text-stone-400">{formatPrice(item.priceCents)} each</span>
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="ml-auto text-xs text-red-500 transition hover:text-red-700"
                  >Remove</button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Allergen info (not a gate, just info) */}
      {allAllergens.length > 0 && (
        <div className="rounded-xl border border-violet-200 bg-violet-50 px-3 py-2">
          <p className="text-xs text-violet-900">
            <span className="font-semibold">Allergens in your basket:</span>{" "}
            {allAllergens.map(allergenLabel).join(", ")}
          </p>
        </div>
      )}

      {/* Pickup / Delivery */}
      <Card>
        <h3 className="text-sm font-bold text-stone-900">How will you receive it?</h3>
        <div className="mt-3 inline-flex rounded-full border border-stone-200 bg-stone-50 p-1 text-sm">
          <button
            type="button"
            onClick={() => setType("pickup")}
            className={`rounded-full px-4 py-1.5 font-medium transition ${
              type === "pickup"
                ? "bg-violet-600 text-white shadow-sm"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >Pickup</button>
          <button
            type="button"
            onClick={() => setType("delivery")}
            className={`rounded-full px-4 py-1.5 font-medium transition ${
              type === "delivery"
                ? "bg-violet-600 text-white shadow-sm"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >Delivery</button>
        </div>
        {type === "delivery" && (
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            rows={2}
            required
            placeholder="Street, building, floor..."
            className="mt-3 block w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-base text-stone-900 outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-200"
          />
        )}
      </Card>

      {/* Notes */}
      <Card>
        <label className="block text-sm font-medium text-stone-700">Notes (optional)</label>
        <textarea
          name="notes"
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Less spicy, extra sauce..."
          className="mt-1 block w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-base text-stone-900 outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-200"
        />
      </Card>

      {/* Total */}
      <Card className="border-violet-200 bg-violet-50/50">
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between text-stone-700">
            <span>{itemCount} item{itemCount !== 1 ? "s" : ""}</span>
            <span>{formatPrice(totalCents)}</span>
          </div>
          <hr className="border-violet-200" />
          <div className="flex justify-between text-base font-bold text-stone-900">
            <span>Total</span>
            <span>{formatPrice(totalCents)}</span>
          </div>
        </div>
      </Card>

      {/* Errors */}
      {state?.error && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700 whitespace-pre-wrap">
          {state.error}
        </p>
      )}
      {state?.errors && state.errors.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-700">
          <p className="font-semibold">Some items could not be ordered:</p>
          <ul className="mt-1 list-inside list-disc">
            {state.errors.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <Link href="/customer/kitchen">
          <Button type="button" variant="secondary" size="lg">Add more</Button>
        </Link>
        <Button
          type="submit"
          size="lg"
          fullWidth
          disabled={pending || (type === "delivery" && !address.trim())}
        >
          {pending
            ? "Placing..."
            : `Place order · ${formatPrice(totalCents)}`}
        </Button>
      </div>
    </form>
  );
}
