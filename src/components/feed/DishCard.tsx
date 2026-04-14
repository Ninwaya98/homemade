import Link from "next/link";
import Image from "next/image";
import { formatPrice, minPriceCents } from "@/lib/constants";
import { RatingBar } from "@/components/ui/RatingBar";

export function DishCard({
  dish,
  cookName,
  cookScore,
  cookReviewCount,
  href,
  className = "",
}: {
  dish: {
    id: string;
    name: string;
    price_cents: number;
    photo_url: string | null;
    allergens: string[];
    portion_sizes: Record<string, { price_cents: number }> | null;
  };
  cookName: string;
  cookScore?: number | null;
  cookReviewCount?: number;
  href: string;
  className?: string;
}) {
  const price = minPriceCents(dish.price_cents, dish.portion_sizes);

  return (
    <Link
      href={href}
      className={`w-44 flex-none snap-start rounded-2xl glass-strong overflow-hidden card-hover ${className}`}
    >
      {dish.photo_url ? (
        <div className="relative h-28 w-full">
          <Image src={dish.photo_url} alt={dish.name} fill className="object-cover" sizes="176px" />
        </div>
      ) : (
        <div className="flex h-28 w-full items-center justify-center bg-gradient-to-br from-stone-100 via-rose-50 to-stone-100">
          <svg className="h-10 w-10 text-stone-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.871c1.355 0 2.697.056 4.024.166C17.155 8.51 18 9.473 18 10.608v2.513M15 8.25v-1.5m-6 1.5v-1.5m12 9.75-1.5.75a3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0L3 16.5m15-3.379a48.474 48.474 0 00-6-.371c-2.032 0-4.034.126-6 .371m12 0c.39.049.777.102 1.163.16 1.07.16 1.837 1.094 1.837 2.175v5.169c0 .621-.504 1.125-1.125 1.125H4.125A1.125 1.125 0 013 20.625v-5.17c0-1.08.768-2.014 1.837-2.174A47.78 47.78 0 016 13.12M12.265 3.11a.375.375 0 11-.53 0L12 2.845l.265.265zm-3 0a.375.375 0 11-.53 0L9 2.845l.265.265zm6 0a.375.375 0 11-.53 0L15 2.845l.265.265z" />
          </svg>
        </div>
      )}
      <div className="p-3">
        <p className="truncate text-sm font-semibold text-stone-900">{dish.name}</p>
        <p className="truncate text-xs text-stone-600">{cookName}</p>
        <div className="mt-1.5 flex items-center justify-between">
          <span className="text-sm font-bold text-rose-600">
            {dish.portion_sizes ? `from ${formatPrice(price)}` : formatPrice(price)}
          </span>
          {cookReviewCount != null && cookReviewCount > 0 && (
            <RatingBar score={cookScore ?? null} reviewCount={cookReviewCount} size="sm" />
          )}
        </div>
      </div>
    </Link>
  );
}
