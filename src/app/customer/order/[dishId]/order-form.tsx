"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useBasket } from "@/lib/basket";
import {
  allergenLabel,
  dayLabel,
  formatPrice,
  PORTION_SIZES,
  type PortionSizeId,
} from "@/lib/constants";
import type { DishPortionSizes } from "@/lib/types";

type Dish = {
  id: string;
  name: string;
  description: string | null;
  photo_url: string | null;
  price_cents: number;
  allergens: string[];
  portion_sizes: DishPortionSizes | null;
};

type Cook = {
  id: string;
  full_name: string;
  location: string | null;
  photo_url: string | null;
};

type Day = { date: string; mode: "preorder" | "on_demand"; left: number };

export function OrderForm({
  dish,
  cook,
  availability,
  unavailableMessage,
}: {
  dish: Dish;
  cook: Cook;
  availability: Day[];
  unavailableMessage?: string;
}) {
  const router = useRouter();
  const { addItem, clearBasket, currentCookId, currentCookName } = useBasket();

  const [portionSize, setPortionSize] = useState<PortionSizeId | null>(() => {
    if (!dish.portion_sizes) return null;
    for (const s of PORTION_SIZES) {
      if (dish.portion_sizes[s.id as keyof DishPortionSizes]) return s.id;
    }
    return null;
  });
  const [quantity, setQuantity] = useState(1);
  const [date, setDate] = useState<string | null>(availability[0]?.date ?? null);
  const [added, setAdded] = useState(false);
  const [conflict, setConflict] = useState(false);

  const selectedConfig = portionSize && dish.portion_sizes
    ? dish.portion_sizes[portionSize as keyof DishPortionSizes]
    : null;
  const unitPrice = selectedConfig?.price_cents ?? dish.price_cents;
  const portionsPerUnit = selectedConfig?.portions ?? 1;
  const total = unitPrice * quantity;

  function availableCount(rawLeft: number) {
    return Math.floor(rawLeft / portionsPerUnit);
  }

  const basketItem = {
    dishId: dish.id,
    dishName: dish.name,
    cookId: cook.id,
    cookName: cook.full_name,
    photoUrl: dish.photo_url,
    portionSize: portionSize,
    portionLabel: selectedConfig?.label ?? null,
    priceCents: unitPrice,
    portions: portionsPerUnit,
    quantity,
    scheduledFor: date!,
    allergens: dish.allergens,
  };

  function handleAdd() {
    if (!date) return;
    if (currentCookId && currentCookId !== cook.id) {
      setConflict(true);
      return;
    }
    addItem(basketItem);
    setAdded(true);
  }

  function handleClearAndAdd() {
    clearBasket();
    addItem(basketItem);
    setConflict(false);
    setAdded(true);
  }

  const canAdd = !!date && (!dish.portion_sizes || !!portionSize);

  // ── Cook conflict ──
  if (conflict) {
    return (
      <div className="space-y-5">
        <Card className="border-amber-200 bg-amber-50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500 text-lg text-white">!</div>
            <div>
              <p className="font-semibold text-amber-900">Different cook</p>
              <p className="text-sm text-amber-700">
                Your basket has items from <strong>{currentCookName}</strong>.
                You can only order from one cook at a time.
              </p>
            </div>
          </div>
        </Card>
        <div className="flex gap-2">
          <Button type="button" variant="secondary" size="lg" onClick={() => setConflict(false)}>
            Keep current basket
          </Button>
          <Button type="button" variant="danger" size="lg" fullWidth onClick={handleClearAndAdd}>
            Clear basket & add this
          </Button>
        </div>
      </div>
    );
  }

  // ── Added confirmation ──
  if (added) {
    return (
      <div className="space-y-5">
        <Card className="border-emerald-200 bg-emerald-50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-lg text-white">✓</div>
            <div>
              <p className="font-semibold text-emerald-900">Added to basket!</p>
              <p className="text-sm text-emerald-700">
                {quantity}x {dish.name}
                {selectedConfig && ` (${selectedConfig.label})`}
                {" "}&middot; {date ? dayLabel(date) : ""}
              </p>
            </div>
          </div>
        </Card>
        <div className="flex gap-2">
          <Button type="button" variant="secondary" size="lg" onClick={() => router.back()}>
            Keep browsing
          </Button>
          <Button type="button" size="lg" fullWidth onClick={() => router.push("/customer/basket")}>
            Go to basket
          </Button>
        </div>
      </div>
    );
  }

  // ── Single smooth order page ──
  return (
    <div className="space-y-5">
      {/* Dish hero */}
      <Card>
        <div className="flex items-start gap-4">
          {dish.photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={dish.photo_url} alt="" className="h-24 w-24 flex-none rounded-xl object-cover shadow-sm" />
          ) : (
            <div className="flex h-24 w-24 flex-none items-center justify-center rounded-xl bg-stone-100 text-3xl">🍽</div>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold text-stone-900">{dish.name}</h1>
            <p className="text-xs text-stone-500">
              from {cook.full_name} {cook.location && `· ${cook.location}`}
            </p>
            {dish.description && (
              <p className="mt-2 text-sm leading-relaxed text-stone-600">{dish.description}</p>
            )}
          </div>
        </div>

        {/* Allergens as info text */}
        {dish.allergens.length > 0 && (
          <div className="mt-4 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2">
            <p className="text-xs font-semibold text-violet-900">
              Contains: {dish.allergens.map(allergenLabel).join(", ")}
            </p>
          </div>
        )}
      </Card>

      {/* Portion size picker */}
      {dish.portion_sizes && (
        <Card>
          <h2 className="text-sm font-bold text-stone-900">Portion size</h2>
          <div className="mt-3 flex gap-2">
            {PORTION_SIZES.map((size) => {
              const config = dish.portion_sizes?.[size.id as keyof DishPortionSizes];
              if (!config) return null;
              const selected = portionSize === size.id;
              return (
                <button
                  key={size.id}
                  type="button"
                  onClick={() => setPortionSize(size.id)}
                  className={`flex-1 rounded-xl border-2 px-3 py-3 text-center transition ${
                    selected
                      ? "border-violet-600 bg-violet-50 shadow-sm"
                      : "border-stone-200 bg-white hover:border-violet-300"
                  }`}
                >
                  <p className="text-sm font-semibold text-stone-900">{config.label}</p>
                  <p className="text-[10px] text-stone-500">{size.servesLabel}</p>
                  <p className="mt-1 text-sm font-bold text-violet-600">{formatPrice(config.price_cents)}</p>
                </button>
              );
            })}
          </div>
        </Card>
      )}

      {/* Pick a day */}
      <Card>
        <h2 className="text-sm font-bold text-stone-900">When</h2>
        {availability.length === 0 ? (
          <p className="mt-2 text-sm text-stone-500">
            {unavailableMessage ?? "No available days in the next week."}
          </p>
        ) : (
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {availability.map((d) => {
              const adjusted = availableCount(d.left);
              const disabled = adjusted <= 0;
              const selected = date === d.date;
              return (
                <button
                  key={d.date}
                  type="button"
                  disabled={disabled}
                  onClick={() => setDate(d.date)}
                  className={`flex-none rounded-xl border-2 px-3 py-2.5 text-center transition ${
                    selected
                      ? "border-violet-600 bg-violet-50 shadow-sm"
                      : "border-stone-200 bg-white"
                  } ${disabled ? "opacity-40" : "hover:border-violet-400"}`}
                >
                  <p className="text-sm font-semibold text-stone-900">{dayLabel(d.date)}</p>
                  <p className="text-[10px] text-stone-500">
                    {adjusted > 0 ? `${adjusted} left` : "sold out"}
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </Card>

      {/* Quantity + total */}
      <Card>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
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
              onClick={() => setQuantity(Math.min(20, quantity + 1))}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-stone-300 bg-white text-lg font-medium text-stone-700 transition hover:border-violet-400 hover:bg-violet-50 active:scale-95"
            >
              +
            </button>
          </div>
          <p className="text-lg font-bold text-violet-600">{formatPrice(total)}</p>
        </div>
      </Card>

      {/* Add to basket button */}
      <Button
        type="button"
        size="lg"
        fullWidth
        disabled={!canAdd}
        onClick={handleAdd}
      >
        Add to basket &middot; {formatPrice(total)}
      </Button>
    </div>
  );
}
