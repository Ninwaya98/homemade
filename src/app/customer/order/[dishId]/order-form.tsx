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

const STEPS = ["choose", "allergen", "checkout"] as const;
type Step = (typeof STEPS)[number];

const STEP_LABELS: Record<Step, string> = {
  choose: "Choose",
  allergen: "Allergens",
  checkout: "Checkout",
};

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
  const [step, setStep] = useState<Step>("choose");
  const [quantity, setQuantity] = useState(1);
  const [type, setType] = useState<"pickup" | "delivery">("pickup");
  const [date, setDate] = useState<string | null>(availability[0]?.date ?? null);
  const [notes, setNotes] = useState("");
  const [address, setAddress] = useState("");
  const [ack, setAck] = useState(false);

  const total = dish.price_cents * quantity;
  const { commission, payout } = splitOrderTotal(total);
  const stepIndex = STEPS.indexOf(step);

  return (
    <div className="space-y-5">
      {/* Step indicator */}
      <StepIndicator current={stepIndex} />

      {/* Step 1 — Choose */}
      {step === "choose" && (
        <>
          {/* Dish card */}
          <Card>
            <div className="flex items-start gap-4">
              {dish.photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={dish.photo_url}
                  alt=""
                  className="h-24 w-24 flex-none rounded-xl object-cover shadow-sm"
                />
              ) : (
                <div className="flex h-24 w-24 flex-none items-center justify-center rounded-xl bg-stone-100 text-3xl">
                  🍽
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h1 className="text-xl font-bold text-stone-900">{dish.name}</h1>
                <p className="text-sm font-semibold text-amber-700">
                  {formatPrice(dish.price_cents)}
                  {dish.portion_size && (
                    <span className="font-normal text-stone-500"> · {dish.portion_size}</span>
                  )}
                </p>
                <p className="text-xs text-stone-500">
                  from {cook.full_name} {cook.location && `· ${cook.location}`}
                </p>
                {dish.description && (
                  <p className="mt-2 text-sm leading-relaxed text-stone-600">{dish.description}</p>
                )}
                {dish.allergens.length > 0 && (
                  <p className="mt-2 rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs font-medium text-amber-900">
                    Contains: {dish.allergens.map(allergenLabel).join(", ")}
                  </p>
                )}
              </div>
            </div>
          </Card>

          {/* Pick a day */}
          <Card>
            <h2 className="text-sm font-bold text-stone-900">Pick a day</h2>
            {availability.length === 0 ? (
              <p className="mt-2 text-sm text-stone-500">
                This cook hasn&apos;t opened any days in the next week.
              </p>
            ) : (
              <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
                {availability.map((d) => {
                  const disabled = d.left <= 0;
                  const selected = date === d.date;
                  return (
                    <button
                      key={d.date}
                      type="button"
                      disabled={disabled}
                      onClick={() => setDate(d.date)}
                      className={`rounded-xl border-2 px-3 py-2.5 text-left transition ${
                        selected
                          ? "border-amber-700 bg-amber-50 shadow-sm shadow-amber-700/10"
                          : "border-stone-200 bg-white"
                      } ${disabled ? "opacity-40" : "hover:border-amber-400"}`}
                    >
                      <div className="text-sm font-semibold text-stone-900">{dayLabel(d.date)}</div>
                      <div className="mt-0.5 flex items-center gap-1">
                        {d.left > 0 ? (
                          <span className="text-[10px] text-emerald-600">{d.left} left</span>
                        ) : (
                          <span className="text-[10px] text-red-500">sold out</span>
                        )}
                      </div>
                      <Badge tone={d.mode === "preorder" ? "blue" : "green"}>
                        {d.mode === "preorder" ? "pre-order" : "on-demand"}
                      </Badge>
                    </button>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Quantity & delivery */}
          <Card>
            <h2 className="text-sm font-bold text-stone-900">Quantity & delivery</h2>

            {/* Quantity stepper */}
            <div className="mt-3 flex items-center gap-1">
              <span className="mr-2 text-sm text-stone-600">Qty</span>
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-stone-300 bg-white text-lg font-medium text-stone-700 transition hover:border-amber-400 hover:bg-amber-50 active:scale-95"
              >
                −
              </button>
              <span className="w-10 text-center text-lg font-bold text-stone-900">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity(Math.min(20, quantity + 1))}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-stone-300 bg-white text-lg font-medium text-stone-700 transition hover:border-amber-400 hover:bg-amber-50 active:scale-95"
              >
                +
              </button>
              <span className="ml-3 text-sm font-medium text-amber-700">
                {formatPrice(total)}
              </span>
            </div>

            {/* Pickup / Delivery toggle */}
            <div className="mt-4">
              <span className="block text-sm text-stone-600">How will you receive it?</span>
              <div className="mt-2 inline-flex rounded-full border border-stone-200 bg-stone-50 p-1 text-sm">
                <button
                  type="button"
                  onClick={() => setType("pickup")}
                  className={`rounded-full px-4 py-1.5 font-medium transition ${
                    type === "pickup"
                      ? "bg-amber-700 text-white shadow-sm"
                      : "text-stone-600 hover:text-stone-900"
                  }`}
                >
                  Pickup
                </button>
                <button
                  type="button"
                  onClick={() => setType("delivery")}
                  className={`rounded-full px-4 py-1.5 font-medium transition ${
                    type === "delivery"
                      ? "bg-amber-700 text-white shadow-sm"
                      : "text-stone-600 hover:text-stone-900"
                  }`}
                >
                  Delivery
                </button>
              </div>
            </div>

            {/* Delivery address */}
            {type === "delivery" && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-stone-700">
                  Delivery address
                </label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={2}
                  required
                  placeholder="Street, building, floor, apartment…"
                  className="mt-1 block w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-base text-stone-900 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200"
                />
              </div>
            )}
          </Card>

          <Button
            type="button"
            size="lg"
            fullWidth
            disabled={!date || (type === "delivery" && !address.trim())}
            onClick={() => setStep("allergen")}
          >
            Continue
          </Button>
        </>
      )}

      {/* Step 2 — Allergen reconfirmation */}
      {step === "allergen" && (
        <>
          <Card className="border-amber-200">
            <h2 className="text-lg font-bold text-stone-900">
              Quick allergen check
            </h2>
            <p className="mt-1 text-sm text-stone-500">
              We show this twice on purpose. Please confirm you&apos;ve read it.
            </p>

            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
              {dish.allergens.length > 0 ? (
                <>
                  <p className="text-sm font-semibold text-amber-900">
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

            <label className="mt-4 flex cursor-pointer items-start gap-2.5 text-sm text-stone-700">
              <input
                type="checkbox"
                checked={ack}
                onChange={(e) => setAck(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-stone-400 text-amber-700 focus:ring-amber-500"
              />
              <span>I understand the allergen information for this dish.</span>
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
        </>
      )}

      {/* Step 3 — Checkout */}
      {step === "checkout" && (
        <form action={formAction} className="space-y-5">
          <input type="hidden" name="dish_id" value={dish.id} />
          <input type="hidden" name="quantity" value={quantity} />
          <input type="hidden" name="type" value={type} />
          <input type="hidden" name="scheduled_for" value={date ?? ""} />
          <input type="hidden" name="allergen_ack" value="on" />
          {type === "delivery" && (
            <input type="hidden" name="delivery_address" value={address} />
          )}

          <Card>
            <h2 className="text-lg font-bold text-stone-900">Order summary</h2>
            <div className="mt-4 space-y-2.5 text-sm">
              <Row label={`${dish.name} × ${quantity}`} value={formatPrice(total)} />
              <Row label="Type" value={type === "pickup" ? "Pickup" : "Delivery"} />
              <Row label="Day" value={date ? dayLabel(date) : "—"} />
              {type === "delivery" && address && (
                <Row label="Deliver to" value={address} />
              )}
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
              className="mt-1 block w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-base text-stone-900 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200"
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
              className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"
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
      )}
    </div>
  );
}

/* ── Step indicator ─────────────────────────────────────────── */

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-2">
      {STEPS.map((s, i) => (
        <div key={s} className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition ${
                i < current
                  ? "bg-emerald-500 text-white"
                  : i === current
                  ? "bg-amber-700 text-white shadow-sm shadow-amber-700/30"
                  : "bg-stone-200 text-stone-500"
              }`}
            >
              {i < current ? "✓" : i + 1}
            </div>
            <span
              className={`text-xs font-medium ${
                i === current ? "text-amber-800" : "text-stone-400"
              }`}
            >
              {STEP_LABELS[s]}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div
              className={`h-0.5 w-6 rounded-full ${
                i < current ? "bg-emerald-400" : "bg-stone-200"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

/* ── Helpers ────────────────────────────────────────────────── */

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between gap-4 ${bold ? "font-semibold text-stone-900" : "text-stone-700"}`}>
      <span>{label}</span>
      <span className="text-right">{value}</span>
    </div>
  );
}
