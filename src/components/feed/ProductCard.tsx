import Link from "next/link";
import { formatPrice } from "@/lib/constants";

export function ProductCard({
  product,
  sellerName,
  href,
}: {
  product: {
    id: string;
    name: string;
    price_cents: number;
    photo_urls: string[];
    category: string;
  };
  sellerName: string;
  href: string;
}) {
  const photo = product.photo_urls[0] ?? null;

  return (
    <Link
      href={href}
      className="w-44 flex-none snap-start rounded-2xl glass-strong overflow-hidden card-hover"
    >
      {photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photo} alt="" className="h-28 w-full object-cover" />
      ) : (
        <div className="flex h-28 w-full items-center justify-center bg-gradient-to-br from-violet-100 to-rose-100 text-3xl">
          🛍
        </div>
      )}
      <div className="p-3">
        <p className="truncate text-sm font-semibold text-stone-900">{product.name}</p>
        <p className="truncate text-xs text-stone-500">{sellerName}</p>
        <span className="mt-1.5 block text-sm font-bold text-violet-600">
          {formatPrice(product.price_cents)}
        </span>
      </div>
    </Link>
  );
}
