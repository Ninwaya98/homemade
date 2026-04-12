import Link from "next/link";
import { formatPrice } from "@/lib/constants";

export function ProductCard({
  product,
  sellerName,
  sellerRating,
  sellerRatingCount,
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
  sellerRating?: number;
  sellerRatingCount?: number;
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
        <div className="flex h-28 w-full items-center justify-center bg-gradient-to-br from-stone-100 via-rose-50 to-stone-100">
          <svg className="h-10 w-10 text-stone-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
          </svg>
        </div>
      )}
      <div className="p-3">
        <p className="truncate text-sm font-semibold text-stone-900">{product.name}</p>
        <p className="truncate text-xs text-stone-600">{sellerName}</p>
        <div className="mt-1.5 flex items-center justify-between">
          <span className="text-sm font-bold text-violet-600">
            {formatPrice(product.price_cents)}
          </span>
          {sellerRating != null && sellerRatingCount != null && sellerRatingCount > 0 && (
            <span className="flex items-center gap-0.5 text-[10px] text-amber-600">
              <span>&#9733;</span>
              {sellerRating.toFixed(1)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
