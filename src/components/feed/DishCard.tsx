import Link from "next/link";
import { formatPrice, minPriceCents, allergenLabel } from "@/lib/constants";

export function DishCard({
  dish,
  cookName,
  href,
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
  href: string;
}) {
  const price = minPriceCents(dish.price_cents, dish.portion_sizes);

  return (
    <Link
      href={href}
      className="w-44 flex-none snap-start rounded-2xl glass-strong overflow-hidden card-hover"
    >
      {dish.photo_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={dish.photo_url}
          alt=""
          className="h-28 w-full object-cover"
        />
      ) : (
        <div className="flex h-28 w-full items-center justify-center bg-gradient-to-br from-violet-100 to-sky-100 text-3xl">
          🍽
        </div>
      )}
      <div className="p-3">
        <p className="truncate text-sm font-semibold text-stone-900">{dish.name}</p>
        <p className="truncate text-xs text-stone-500">{cookName}</p>
        <div className="mt-1.5 flex items-center justify-between">
          <span className="text-sm font-bold text-violet-600">
            {dish.portion_sizes ? `from ${formatPrice(price)}` : formatPrice(price)}
          </span>
        </div>
        {dish.allergens.length > 0 && (
          <p className="mt-1 truncate text-[10px] text-stone-400">
            {dish.allergens.map(allergenLabel).join(", ")}
          </p>
        )}
      </div>
    </Link>
  );
}
