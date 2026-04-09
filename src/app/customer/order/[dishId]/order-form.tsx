"use client";

import { useActionState, useState } from "react";

import { placeOrder, type OrderFormState } from "@/app/customer/actions";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  allergenLabel,
  dayLabel,
  formatPrice,
  splitOrderTotal,
} from "@/lib/constants";

const initial: OrderFormState = undefined;

type Dish = {
  id: string;
  name: string;
  description: string | null;
  photo_url: string | null;
  price_cents: number;
  portion_size: string | null;
  allergens: string[];
};

type Cook = {
  full_name: string;
  location: string | null;
  photo_url: string | null;
};

type Day = { date: string; mode: "preorder" | "on_demand"; left: number };

export function OrderForm({
  dish,
  cook,
  availability,
}: {
  dish: Dish;
  cook: Cook;
  availability: Day[];
}) {
  const [state, formAction, pending] = useActionState(placeOrder, initial);
  const [step, setStep] = useState<"choose" | "allergen" | "checkout">("choose");
  const [quantity, setQuantity] = useState(1);
  const [type, setType] = useState<"pickup" | "delivery">("pickup");
  const [date, setDate] = useState<string | null>(availability[0]?.date ?? null);
  const [notes, setNotes] = useState("");
  const [ack, setAck] = useState(false);

  const total = dish.price_cents * quantity;
  const { commission, payout } = splitOrderTotal(total);

  // Step 1 — Choose: dish details, quantity, day, type
  if (step === "choose") {
    return (
      <div className="space-y-5">
        <Card>
          <div className="flex items-start gap-4">
            {dish.photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={dish.photo_url}
                alt=""
                className="h-24 w-24 flex-none rounded-lg object-cover"
              />
            ) : (
              <div className="h-24 w-24 flex-none rounded-lg bg-stone-100" />
            )}
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-semibold text-stone-900">{dish.name}</h1>
              <p className="text-sm font-medium text-stone-700">
                {formatPrice(dish.price_cents)}
                {dish.portion_size && ` · ${dish.portion_size}`}
              </p>
              <p className="text-xs text-stone-500">
                from {cook.full_name} {cook.location && `· ${cook.location}`}
              </p>
              {dish.description && (
                <p className="mt-2 text-sm text-stone-600">{dish.description}</p>
              )}
              {dish.allergens.length > 0 && (
                <p className="mt-2 rounded-md bg-amber-50 px-2 py-1 text-xs text-amber-900">
                  Contains: {dish.allergens.map(allergenLabel).join(", ")}
                </p>
              )}
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="text-sm font-semibold text-stone-900">Pick a day</h2>
          {availability.length === 0 ? (
            <p className="mt-2 text-sm text-stone-500">
              This cook hasn&apos;t opened any days in the next week.
            </p>
          ) : (
            <div className="mt-3 flex flex-wrap gap-2">
              {availability.map((d) => {
                const disabled = d.left <= 0;
                return (
                  <button
                    key={d.date}
                    type="button"
                    disabled={disabled}
                    onClick={() => setDate(d.date)}
                    className={`rounded-lg border-2 px-3 py-2 text-sm transition ${
                      date === d.date
                        ? "border-amber-700 bg-amber-50 text-amber-900"
                        : "border-stone-200 bg-white text-stone-700"
                    } ${disabled ? "opacity-40" : "hover:border-amber-400"}`}
                  >
                    <div className="font-medium">{dayLabel(d.date)}</div>
                    <div className="text-[10px] text-stone-500">
                      {d.left > 0 ? `${d.left} left` : "sold out"} · {d.mode === "preorder" ? "pre-order" : "on-demand"}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </Card>

        <Card>
          <h2 className="text-sm font-semibold text-stone-900">Quantity & delivery</h2>
          <div className="mt-3 flex items-center gap-4">
            <label className="text-sm text-stone-700">Qty</label>
            <input
              type="number"
              min="1"
              max="20"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value) || 1)}
              className="w-20 rounded-lg border border-stone-300 px-3 py-1.5 text-base outline-none focus:border-amber-600"
            />
          </div>
          <div className="mt-4">
            <label className="block text-sm text-stone-700">How will you receive it?</label>
            <div className="mt-2 inline-flex rounded-full border border-stone-300 bg-white p-0.5 text-sm">
              <button
                type="button"
                onClick={() => setType("pickup")}
                className={`rounded-full px-3 py-1 ${
                  type === "pickup" ? "bg-amber-700 text-white" : "text-stone-700"
                }`}
              >
                Pickup
              </button>
              <button
                type="button"
                onClick={() => setType("delivery")}
                className={`rounded-full px-3 py-1 ${
                  type === "delivery" ? "bg-amber-700 text-white" : "text-stone-700"
                }`}
              >
                Delivery
              </button>
            </div>
          </div>
        </Card>

        <Button
          type="button"
          size="lg"
          fullWidth
          disabled={!date}
          onClick={() => setStep("allergen")}
        >
          Continue
        </Button>
      </div>
    );
  }

  // Step 2 — Allergen reconfirmation (the brief's mandatory second touchpoint)
  if (step === "allergen") {
    return (
      <div className="space-y-5">
        <Card className="border-amber-300">
          <h2 className="text-lg font-semibold text-stone-900">
            Quick allergen check
          </h2>
          <p className="mt-1 text-sm text-stone-600">
            We show this twice on purpose. Please confirm you&apos;ve read it.
          </p>

          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
            {dish.allergens.length > 0 ? (
              <>
                <p className="text-sm font-medium text-amber-900">
                  This dish contains:
                </p>
                <ul className="mt-2 space-y-1 text-sm text-amber-900">
                  {dish.allergens.map((a) => (
                    <li key={a}>• {allergenLabel(a)}</li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="text-sm text-amber-900">
                The cook has confirmed this dish contains <strong>none</strong>{" "}
                of the standard allergens. If you have a different concern,
                ask them in your order notes.
              </p>
            )}
          </div>

          <label className="mt-4 flex cursor-pointer items-start gap-2 text-sm text-stone-700">
            <input
              type="checkbox"
              checked={ack}
              onChange={(e) => setAck(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-stone-400 text-amber-700 focus:ring-amber-500"
            />
            <span>
              I understand the allergen information for this dish.
            </span>
          </label>
        </Card>

        <div className="flex gap-2">
          <Button
            type="button"
            variant="secondary"
            size="lg"
            onClick={() => setStep("choose")}
          >
            Back
          </Button>
          <Button
            type="button"
            size="lg"
            fullWidth
            disabled={!ack}
            onClick={() => setStep("checkout")}
          >
            Continue to checkout
          </Button>
        </div>
      </div>
    );
  }

  // Step 3 — Checkout (Stripe stubbed)
  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="dish_id" value={dish.id} />
      <input type="hidden" name="quantity" value={quantity} />
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="scheduled_for" value={date ?? ""} />
      <input type="hidden" name="allergen_ack" value="on" />

      <Card>
        <h2 className="text-lg font-semibold text-stone-900">Order summary</h2>
        <div className="mt-3 space-y-2 text-sm">
          <Row label={`${dish.name} × ${quantity}`} value={formatPrice(total)} />
          <Row label="Pickup or delivery" value={type === "pickup" ? "Pickup" : "Delivery"} />
          <Row label="Day" value={date ? dayLabel(date) : "—"} />
          <hr className="my-3 border-stone-100" />
          <Row label="Total" value={formatPrice(total)} bold />
          <p className="text-[11px] text-stone-400">
            Includes a {Math.round((commission / total) * 100)}% platform fee
            ({formatPrice(commission)}). Cook receives {formatPrice(payout)}.
          </p>
        </div>
      </Card>

      <Card>
        <label className="block text-sm font-medium text-stone-700">
          Notes for the cook (optional)
        </label>
        <textarea
          name="notes"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Less spicy, gluten-free if possible…"
          className="mt-1 block w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-base text-stone-900 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200"
        />
      </Card>

      <Card className="border-dashed border-stone-300 bg-stone-50">
        <p className="text-xs text-stone-500">
          <strong>Payment:</strong> Stripe Connect isn&apos;t wired up in this MVP yet. Your
          order will be created as if paid — wire Stripe before launch.
        </p>
      </Card>

      {state?.error && (
        <p
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {state.error}
        </p>
      )}

      <div className="flex gap-2">
        <Button
          type="button"
          variant="secondary"
          size="lg"
          onClick={() => setStep("allergen")}
        >
          Back
        </Button>
        <Button type="submit" size="lg" fullWidth disabled={pending}>
          {pending ? "Placing…" : `Place order · ${formatPrice(total)}`}
        </Button>
      </div>
    </form>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? "font-semibold text-stone-900" : "text-stone-700"}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
