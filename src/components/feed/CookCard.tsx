import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/Badge";
import { RatingBar } from "@/components/ui/RatingBar";

export function CookCard({
  cook,
  href,
  type,
  isOpen,
}: {
  cook: {
    name: string;
    photo_url: string | null;
    location: string | null;
    cuisineTags?: string[];
    shopName?: string;
    avg_rating: number;
    rating_count: number;
    score?: number | null;
    like_count?: number;
    dislike_count?: number;
  };
  href: string;
  type: "cook" | "seller";
  isOpen?: boolean;
}) {
  const initial = cook.name.trim().charAt(0).toUpperCase();
  const displayName = type === "seller" && cook.shopName ? cook.shopName : cook.name;

  return (
    <Link
      href={href}
      className="w-48 flex-none snap-start rounded-2xl glass-strong p-4 card-hover"
    >
      <div className="flex items-center gap-3">
        {cook.photo_url ? (
          <Image
            src={cook.photo_url}
            alt={cook.name}
            width={48}
            height={48}
            className="h-12 w-12 flex-none rounded-full object-cover ring-2 ring-violet-100"
          />
        ) : (
          <div className="flex h-12 w-12 flex-none items-center justify-center rounded-full gradient-purple text-lg font-bold text-white">
            {initial}
          </div>
        )}
        <div className="min-w-0">
          <div className="flex items-center gap-1">
            <p className="truncate text-sm font-semibold text-stone-900">{displayName}</p>
            {/* Verified badge */}
            <svg className="h-3.5 w-3.5 flex-none text-violet-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.403 12.652a3 3 0 000-5.304 3 3 0 00-3.75-3.751 3 3 0 00-5.305 0 3 3 0 00-3.751 3.75 3 3 0 000 5.305 3 3 0 003.75 3.751 3 3 0 005.305 0 3 3 0 003.751-3.75zm-2.546-4.46a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
            </svg>
          </div>
          {cook.location && (
            <p className="truncate text-[11px] text-stone-600">{cook.location}</p>
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1">
        {isOpen && <Badge tone="green">Open</Badge>}
        <Badge tone={type === "cook" ? "blue" : "neutral"}>
          {type === "cook" ? "Kitchen" : "Market"}
        </Badge>
        {cook.cuisineTags?.slice(0, 2).map((t) => (
          <Badge key={t} tone="neutral">{t}</Badge>
        ))}
      </div>

      <div className="mt-2">
        <RatingBar
          score={cook.score ?? null}
          reviewCount={(cook.like_count ?? 0) + (cook.dislike_count ?? 0) || cook.rating_count}
          size="sm"
        />
      </div>
    </Link>
  );
}
