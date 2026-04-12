import Link from "next/link";
import { Badge } from "@/components/ui/Badge";

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
  };
  href: string;
  type: "cook" | "seller";
  isOpen?: boolean;
}) {
  const initial = cook.name.trim().charAt(0).toUpperCase();

  return (
    <Link
      href={href}
      className="w-48 flex-none snap-start rounded-2xl glass-strong p-4 card-hover"
    >
      <div className="flex items-center gap-3">
        {cook.photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cook.photo_url}
            alt=""
            className="h-12 w-12 flex-none rounded-full object-cover ring-2 ring-violet-100"
          />
        ) : (
          <div className="flex h-12 w-12 flex-none items-center justify-center rounded-full gradient-purple text-lg font-bold text-white">
            {initial}
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-stone-900">
            {type === "seller" && cook.shopName ? cook.shopName : cook.name}
          </p>
          {cook.location && (
            <p className="truncate text-[11px] text-stone-500">{cook.location}</p>
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

      {cook.rating_count > 0 && (
        <p className="mt-2 text-xs text-stone-500">
          <span className="text-amber-500">&#9733;</span> {cook.avg_rating.toFixed(1)}
          <span className="text-stone-400"> ({cook.rating_count})</span>
        </p>
      )}
    </Link>
  );
}
