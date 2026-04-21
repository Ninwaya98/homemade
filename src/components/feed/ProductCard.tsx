import Link from "next/link";
import Image from "next/image";
import { formatPrice } from "@/lib/constants";
import { RatingBar } from "@/components/ui/RatingBar";

export function ProductCard({
  product,
  sellerName,
  sellerScore,
  sellerReviewCount,
  href,
  className = "",
  priority = false,
}: {
  product: {
    id: string;
    name: string;
    price_cents: number;
    photo_urls: string[];
    category: string;
  };
  sellerName: string;
  sellerScore?: number | null;
  sellerReviewCount?: number;
  href: string;
  className?: string;
  priority?: boolean;
}) {
  const photo = product.photo_urls[0] ?? null;

  return (
    <Link
      href={href}
      className={`w-44 flex-none snap-start rounded-2xl glass-strong overflow-hidden card-hover ${className}`}
    >
      {photo ? (
        <div className="relative h-28 w-full">
          <Image src={photo} alt={product.name} fill className="object-cover" sizes="176px" priority={priority} />
        </div>
      ) : (
        <div className="flex h-28 w-full items-center justify-center bg-gradient-to-br from-stone-100 via-sky-50 to-stone-100">
          <svg className="h-10 w-10 text-stone-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
          </svg>
        </div>
      )}
      <div className="p-3">
        <p className="truncate text-sm font-semibold text-stone-900">{product.name}</p>
        <p className="truncate text-xs text-stone-600">{sellerName}</p>
        <div className="mt-1.5 flex items-center justify-between">
          <span className="text-sm font-bold text-sky-600">
            {formatPrice(product.price_cents)}
          </span>
          {sellerReviewCount != null && sellerReviewCount > 0 && (
            <RatingBar score={sellerScore ?? null} reviewCount={sellerReviewCount} size="sm" />
          )}
        </div>
      </div>
    </Link>
  );
}
