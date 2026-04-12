"use client";

import { useBasket } from "@/lib/basket";

export function BasketBadge() {
  const { itemCount } = useBasket();
  if (itemCount === 0) return null;
  return (
    <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-violet-600 px-1 text-[9px] font-bold leading-none text-white shadow-sm">
      {itemCount > 9 ? "9+" : itemCount}
    </span>
  );
}
