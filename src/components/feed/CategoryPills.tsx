"use client";

import Link from "next/link";
import { PRODUCT_CATEGORIES } from "@/lib/constants";

const pills = PRODUCT_CATEGORIES.map((c) => ({
  label: c.label,
  href: `/customer/market?category=${c.id}`,
}));

export function CategoryPills() {
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
      {pills.map((pill) => (
        <Link
          key={pill.href + pill.label}
          href={pill.href}
          className="flex-none rounded-full border border-stone-200 bg-white px-3.5 py-1.5 text-sm font-medium text-stone-600 transition hover:border-violet-400 hover:bg-violet-50 hover:text-violet-700 active:scale-95"
        >
          {pill.label}
        </Link>
      ))}
    </div>
  );
}
