"use client";

import { useBasket } from "@/lib/basket";

export function BasketBadge() {
  const { itemCount } = useBasket();
  if (itemCount === 0) return null;
  return (
    <span className="ml-1 inline-flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-violet-600 px-1 text-[10px] font-bold leading-none text-white">
      {itemCount > 99 ? "99+" : itemCount}
    </span>
  );
}
