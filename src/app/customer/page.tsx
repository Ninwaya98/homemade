import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { Card, EmptyState } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/Button";
import { allergenLabel, formatPrice, todayIso, CUISINES } from "@/lib/constants";

export const metadata = {
  title: "Browse — Authentic Kitchen",
};

export default async function CustomerBrowsePage({
  searchParams,
}: {
  searchParams: Promise<{ cuisine?: string; today?: string }>;
}) {
  await requireRole("customer");
  const supabase = await createClient();
  const sp = await searchParams;

  // Pull approved cooks with their active dishes. Include today's
  // availability in the same query to avoid an N+1.
  let cooksQuery = supabase
    .from("cook_profiles")
    .select(
      `
      id,
      bio,
      cuisine_tags,
      photo_url,
      avg_rating,
      rating_count,
      profiles!cook_profiles_id_fkey!inner(full_name, location),
      dishes(id, name, description, price_cents, photo_url, allergens, status, cuisine_tag),
      availability(cook_id, is_open, date)
      `,
    )
    .eq("status", "approved")
    .eq("availability.date", todayIso())
    .limit(30);

  if (sp.cuisine) {
    cooksQuery = cooksQuery.contains("cuisine_tags", [sp.cuisine]);
  }

  const { data: cooks } = await cooksQuery;

  const filtered = (cooks ?? [])
    .map((c) => ({
      ...c,
      profile: c.profiles as { full_name?: string; location?: string | null } | null,
      activeDishes: (c.dishes ?? []).filter((d) => d.status === "active"),
      isOpenToday: (c.availability ?? []).some((a) => a.is_open),
    }))
    .filter((c) => c.activeDishes.length > 0)
    .filter((c) => !sp.today || c.isOpenToday);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-stone-900">
          Real food, real people, near you
        </h1>
      </header>

      {/* Filter pills */}
      <div className="-mx-1 flex flex-wrap gap-1.5">
        <FilterPill href="/customer" active={!sp.cuisine && !sp.today}>
          All
        </FilterPill>
        <FilterPill
          href={`/customer?today=1${sp.cuisine ? `&cuisine=${sp.cuisine}` : ""}`}
          active={!!sp.today}
        >
          Open today
        </FilterPill>
        {CUISINES.slice(0, 8).map((c) => (
          <FilterPill
            key={c}
            href={`/customer?cuisine=${encodeURIComponent(c)}${sp.today ? "&today=1" : ""}`}
            active={sp.cuisine === c}
          >
            {c}
          </FilterPill>
        ))}
      </div>

      {filtered.length > 0 ? (
        <div className="space-y-5">
          {filtered.map((cook) => (
            <Card key={cook.id} className="overflow-hidden p-0">
              <Link
                href={`/customer/cooks/${cook.id}`}
                className="flex items-start gap-4 p-5 hover:bg-stone-50"
              >
                {cook.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={cook.photo_url}
                    alt=""
                    className="h-16 w-16 flex-none rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 flex-none items-center justify-center rounded-full bg-amber-100 text-xl font-semibold text-amber-700">
                    {cook.profile?.full_name?.[0]?.toUpperCase() ?? "?"}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-semibold text-stone-900">
                    {cook.profile?.full_name}
                  </h2>
                  <p className="text-xs text-stone-500">
                    {cook.profile?.location ?? "—"}
                    {cook.rating_count > 0 && (
                      <> · ⭐ {Number(cook.avg_rating).toFixed(1)} ({cook.rating_count})</>
                    )}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {cook.cuisine_tags.slice(0, 4).map((t) => (
                      <Badge key={t} tone="neutral">
                        {t}
                      </Badge>
                    ))}
                  </div>
                  {cook.bio && (
                    <p className="mt-2 line-clamp-2 text-sm text-stone-600">
                      {cook.bio}
                    </p>
                  )}
                </div>
              </Link>

              <div className="border-t border-stone-100 bg-stone-50/50 p-5">
                <p className="mb-3 text-xs font-medium uppercase tracking-wide text-stone-500">
                  On the menu
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {cook.activeDishes.slice(0, 4).map((dish) => (
                    <Link
                      key={dish.id}
                      href={`/customer/order/${dish.id}`}
                      className="flex items-center gap-3 rounded-lg border border-stone-200 bg-white p-3 hover:border-amber-300"
                    >
                      {dish.photo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={dish.photo_url}
                          alt=""
                          className="h-14 w-14 flex-none rounded object-cover"
                        />
                      ) : (
                        <div className="h-14 w-14 flex-none rounded bg-stone-100" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-stone-900">
                          {dish.name}
                        </p>
                        <p className="text-xs text-stone-500">
                          {formatPrice(dish.price_cents)}
                        </p>
                        {dish.allergens.length > 0 && (
                          <p className="mt-0.5 truncate text-[10px] text-stone-400">
                            contains: {dish.allergens.map(allergenLabel).join(", ")}
                          </p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No cooks match your filters"
          body={
            sp.cuisine || sp.today
              ? "Try removing a filter."
              : "As soon as cooks are approved, their dishes will appear here."
          }
          action={
            (sp.cuisine || sp.today) && (
              <LinkButton href="/customer" variant="secondary" size="sm">
                Clear filters
              </LinkButton>
            )
          }
        />
      )}
    </div>
  );
}

function FilterPill({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full border px-3 py-1.5 text-sm transition ${
        active
          ? "border-amber-700 bg-amber-700 text-white"
          : "border-stone-300 bg-white text-stone-700 hover:border-amber-400"
      }`}
    >
      {children}
    </Link>
  );
}
