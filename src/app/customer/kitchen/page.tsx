import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { EmptyState } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/Button";
import { allergenLabel, formatPrice, todayIso, CUISINES } from "@/lib/constants";

export const metadata = {
  title: "Kitchen — HomeMade",
};

export default async function KitchenBrowsePage({
  searchParams,
}: {
  searchParams: Promise<{ cuisine?: string; today?: string }>;
}) {
  await requireRole("customer");
  const supabase = await createClient();
  const sp = await searchParams;

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
        <h1 className="text-2xl font-bold text-stone-900">
          HomeMade Kitchen
        </h1>
        <p className="mt-1 text-sm text-stone-500">Home-cooked food from approved cooks near you</p>
      </header>

      {/* Filter pills */}
      <div className="-mx-1 flex flex-wrap gap-1.5">
        <FilterPill href="/customer/kitchen" active={!sp.cuisine && !sp.today}>
          All
        </FilterPill>
        <FilterPill
          href={`/customer/kitchen?today=1${sp.cuisine ? `&cuisine=${sp.cuisine}` : ""}`}
          active={!!sp.today}
        >
          Open today
        </FilterPill>
        {CUISINES.slice(0, 8).map((c) => (
          <FilterPill
            key={c}
            href={`/customer/kitchen?cuisine=${encodeURIComponent(c)}${sp.today ? "&today=1" : ""}`}
            active={sp.cuisine === c}
          >
            {c}
          </FilterPill>
        ))}
      </div>

      {filtered.length > 0 ? (
        <div className="space-y-5">
          {filtered.map((cook) => (
            <article
              key={cook.id}
              className="card-hover overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-sm"
            >
              <Link
                href={`/customer/cooks/${cook.id}`}
                className="flex items-start gap-4 p-5 transition hover:bg-stone-50/50"
              >
                {cook.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={cook.photo_url}
                    alt=""
                    className="h-16 w-16 flex-none rounded-2xl object-cover shadow-sm ring-2 ring-amber-100"
                  />
                ) : (
                  <div className="flex h-16 w-16 flex-none items-center justify-center rounded-2xl bg-gradient-to-br from-amber-100 to-amber-200 text-xl font-bold text-amber-700 shadow-sm">
                    {cook.profile?.full_name?.[0]?.toUpperCase() ?? "?"}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-stone-900">
                      {cook.profile?.full_name}
                    </h2>
                    {cook.isOpenToday && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Open
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-stone-500">
                    {cook.profile?.location ?? "—"}
                    {cook.rating_count > 0 && (
                      <span className="ml-1.5 inline-flex items-center gap-0.5 text-amber-600">
                        <span className="text-xs">★</span>
                        {Number(cook.avg_rating).toFixed(1)}
                        <span className="text-stone-400">({cook.rating_count})</span>
                      </span>
                    )}
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {cook.cuisine_tags.slice(0, 4).map((t) => (
                      <Badge key={t} tone="neutral">{t}</Badge>
                    ))}
                  </div>
                  {cook.bio && (
                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-stone-600">
                      {cook.bio}
                    </p>
                  )}
                </div>
              </Link>

              <div className="border-t border-stone-100 bg-gradient-to-b from-stone-50/50 to-stone-50 p-5">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-stone-400">
                  On the menu
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {cook.activeDishes.slice(0, 4).map((dish) => (
                    <Link
                      key={dish.id}
                      href={`/customer/order/${dish.id}`}
                      className="group flex items-center gap-3 rounded-xl border border-stone-200/80 bg-white p-3 shadow-sm transition hover:border-amber-300 hover:shadow-md"
                    >
                      {dish.photo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={dish.photo_url} alt="" className="h-14 w-14 flex-none rounded-lg object-cover" />
                      ) : (
                        <div className="flex h-14 w-14 flex-none items-center justify-center rounded-lg bg-stone-100 text-2xl">🍽</div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-stone-900 group-hover:text-amber-800">{dish.name}</p>
                        <p className="text-sm font-medium text-amber-700">{formatPrice(dish.price_cents)}</p>
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
            </article>
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
              <LinkButton href="/customer/kitchen" variant="secondary" size="sm">
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
      className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
        active
          ? "border-amber-700 bg-amber-700 text-white shadow-sm shadow-amber-700/20"
          : "border-stone-200 bg-white text-stone-600 shadow-sm hover:border-amber-300 hover:text-amber-800"
      }`}
    >
      {children}
    </Link>
  );
}
