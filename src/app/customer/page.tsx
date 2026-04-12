import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { todayIso, isoDow } from "@/lib/constants";
import { LinkButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/Card";
import { HorizontalScroll } from "@/components/feed/HorizontalScroll";
import { SectionHeader } from "@/components/feed/SectionHeader";
import { DishCard } from "@/components/feed/DishCard";
import { ProductCard } from "@/components/feed/ProductCard";
import { CookCard } from "@/components/feed/CookCard";
import { CategoryPills } from "@/components/feed/CategoryPills";

export const metadata = {
  title: "HomeMade -- Real food & handmade goods, made by real people",
};

export default async function FeedPage() {
  const profile = await getCurrentProfile();
  const isLoggedIn = !!profile;
  const supabase = await createClient();
  const today = todayIso();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;

  const [
    { data: openCooks },
    { data: popularDishes },
    { data: products },
    { data: newCooks },
    { data: newSellers },
  ] = await Promise.all([
    // Open cooks (approved + available)
    sb
      .from("cook_profiles")
      .select(`
        id, cuisine_tags, photo_url, avg_rating, rating_count, is_available, weekly_schedule,
        profiles!cook_profiles_id_fkey!inner(full_name, location),
        dishes(id, name, price_cents, photo_url, allergens, status, portion_sizes),
        availability(is_open, date)
      `)
      .eq("status", "approved")
      .eq("is_available", true)
      .limit(10),

    // Popular dishes
    sb
      .from("dishes")
      .select(`
        id, name, price_cents, photo_url, allergens, portion_sizes,
        cook_profiles!inner(id, avg_rating, status, profiles!cook_profiles_id_fkey!inner(full_name))
      `)
      .eq("status", "active")
      .eq("cook_profiles.status", "approved")
      .order("created_at", { ascending: false })
      .limit(12),

    // Handmade goods
    sb
      .from("products")
      .select(`
        id, name, price_cents, photo_urls, category,
        seller_profiles!inner(id, shop_name, avg_rating, rating_count, status, profiles!seller_profiles_id_fkey!inner(full_name))
      `)
      .eq("status", "active")
      .eq("seller_profiles.status", "approved")
      .order("created_at", { ascending: false })
      .limit(12),

    // New cooks
    supabase
      .from("cook_profiles")
      .select(`id, photo_url, cuisine_tags, avg_rating, rating_count, profiles!cook_profiles_id_fkey!inner(full_name, location)`)
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(6),

    // New sellers
    sb
      .from("seller_profiles")
      .select(`id, shop_name, photo_url, category, avg_rating, rating_count, profiles!seller_profiles_id_fkey!inner(full_name, location)`)
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  // Filter cooks open today (via availability rows or weekly schedule)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const availableCooks = (openCooks ?? []).filter((c: any) => {
    const hasOpenDay = (c.availability ?? []).some(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (a: any) => a.date === today && a.is_open,
    );
    let openViaSchedule = false;
    if (!hasOpenDay && c.weekly_schedule) {
      const dow = isoDow(today);
      const dayConfig = c.weekly_schedule[String(dow)];
      openViaSchedule = dayConfig?.is_open ?? false;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const hasActiveDishes = (c.dishes ?? []).some((d: any) => d.status === "active");
    return (hasOpenDay || openViaSchedule) && hasActiveDishes;
  });

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const hasContent =
    availableCooks.length > 0 ||
    (popularDishes ?? []).length > 0 ||
    (products ?? []).length > 0;

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <header>
        {isLoggedIn ? (
          <>
            <h1 className="text-2xl font-black text-stone-900">
              {greeting}, {profile.full_name.split(" ")[0]}
            </h1>
            <p className="mt-1 text-sm text-stone-500">
              Real food & handmade goods from your neighbourhood
            </p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-black text-stone-900">
              Everything{" "}
              <span className="gradient-text-animate">HomeMade</span>
            </h1>
            <p className="mt-1 text-sm text-stone-500">
              Fresh food from home cooks. Handmade goods from local artisans.
            </p>
          </>
        )}
      </header>

      <CategoryPills />

      {!hasContent && (
        <EmptyState
          title="Our marketplace is just getting started"
          body="Check back soon — cooks and sellers are setting up!"
          action={<LinkButton href="/cook/onboarding">Become a cook</LinkButton>}
        />
      )}

      {/* Open Today */}
      {availableCooks.length > 0 && (
        <section className="space-y-3">
          <SectionHeader title="Open today" seeAllHref="/customer/kitchen?today=1" />
          <HorizontalScroll>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {availableCooks.map((c: any) => (
              <CookCard
                key={c.id}
                cook={{
                  name: c.profiles?.full_name ?? "Cook",
                  photo_url: c.photo_url,
                  location: c.profiles?.location ?? null,
                  cuisineTags: c.cuisine_tags,
                  avg_rating: c.avg_rating,
                  rating_count: c.rating_count,
                }}
                href={`/customer/cooks/${c.id}`}
                type="cook"
                isOpen
              />
            ))}
          </HorizontalScroll>
        </section>
      )}

      {/* Popular Dishes */}
      {(popularDishes ?? []).length > 0 && (
        <section className="space-y-3">
          <SectionHeader title="Popular dishes" seeAllHref="/customer/kitchen" />
          <HorizontalScroll>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {(popularDishes ?? []).map((d: any) => (
              <DishCard
                key={d.id}
                dish={{
                  id: d.id,
                  name: d.name,
                  price_cents: d.price_cents,
                  photo_url: d.photo_url,
                  allergens: d.allergens ?? [],
                  portion_sizes: d.portion_sizes ?? null,
                }}
                cookName={d.cook_profiles?.profiles?.full_name ?? "Cook"}
                cookRating={d.cook_profiles?.avg_rating}
                cookRatingCount={d.cook_profiles?.rating_count}
                href={isLoggedIn ? `/customer/order/${d.id}` : `/customer/cooks/${d.cook_profiles?.id}`}
              />
            ))}
          </HorizontalScroll>
        </section>
      )}

      {/* Handmade Goods */}
      {(products ?? []).length > 0 && (
        <section className="space-y-3">
          <SectionHeader title="Handmade goods" seeAllHref="/customer/market" />
          <HorizontalScroll>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {(products ?? []).map((p: any) => (
              <ProductCard
                key={p.id}
                product={{
                  id: p.id,
                  name: p.name,
                  price_cents: p.price_cents,
                  photo_urls: p.photo_urls ?? [],
                  category: p.category,
                }}
                sellerName={p.seller_profiles?.shop_name ?? "Seller"}
                sellerRating={p.seller_profiles?.avg_rating}
                sellerRatingCount={p.seller_profiles?.rating_count}
                href={isLoggedIn ? `/customer/market/order/${p.id}` : `/customer/market/sellers/${p.seller_profiles?.id}`}
              />
            ))}
          </HorizontalScroll>
        </section>
      )}

      {/* New on HomeMade */}
      {((newCooks ?? []).length > 0 || (newSellers ?? []).length > 0) && (
        <section className="space-y-3">
          <SectionHeader title="New on HomeMade" />
          <HorizontalScroll>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {(newCooks ?? []).map((c: any) => (
              <CookCard
                key={`c-${c.id}`}
                cook={{
                  name: c.profiles?.full_name ?? "Cook",
                  photo_url: c.photo_url,
                  location: c.profiles?.location ?? null,
                  cuisineTags: c.cuisine_tags,
                  avg_rating: c.avg_rating,
                  rating_count: c.rating_count,
                }}
                href={`/customer/cooks/${c.id}`}
                type="cook"
              />
            ))}
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {(newSellers ?? []).map((s: any) => (
              <CookCard
                key={`s-${s.id}`}
                cook={{
                  name: s.profiles?.full_name ?? "Seller",
                  shopName: s.shop_name,
                  photo_url: s.photo_url,
                  location: s.profiles?.location ?? null,
                  avg_rating: s.avg_rating,
                  rating_count: s.rating_count,
                }}
                href={`/customer/market/sellers/${s.id}`}
                type="seller"
              />
            ))}
          </HorizontalScroll>
        </section>
      )}

      {/* ── About the platform (scroll-down discovery) ────── */}

      {/* How it works */}
      <section className="space-y-4">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-violet-500">How it works</p>
          <h2 className="mt-1 text-xl font-bold text-stone-900">Simple as 1-2-3</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl glass-strong p-5 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-violet-100 text-xl">🔍</div>
            <h3 className="mt-3 text-sm font-bold text-stone-900">Find</h3>
            <p className="mt-1 text-xs text-stone-500">
              Browse local cooks and artisan sellers. Filter by cuisine, category, or availability.
            </p>
          </div>
          <div className="rounded-2xl glass-strong p-5 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-sky-100 text-xl">🧺</div>
            <h3 className="mt-3 text-sm font-bold text-stone-900">Order</h3>
            <p className="mt-1 text-xs text-stone-500">
              Pick your portions, choose a day, add to basket. Allergens listed on every dish.
            </p>
          </div>
          <div className="rounded-2xl glass-strong p-5 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-xl">⭐</div>
            <h3 className="mt-3 text-sm font-bold text-stone-900">Enjoy & review</h3>
            <p className="mt-1 text-xs text-stone-500">
              Pick up or get delivery. Leave a review to help the community grow.
            </p>
          </div>
        </div>
      </section>

      {/* What you'll find */}
      <section className="space-y-4">
        <div className="text-center">
          <h2 className="text-xl font-bold text-stone-900">What you&apos;ll find</h2>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { icon: "🍳", label: "Home cooking" },
            { icon: "🎨", label: "Crafts & Art" },
            { icon: "👗", label: "Clothing" },
            { icon: "🏠", label: "Home Decor" },
            { icon: "🥘", label: "Packaged food" },
            { icon: "🕯️", label: "Candles" },
            { icon: "💍", label: "Jewelry" },
            { icon: "🧵", label: "Textiles" },
          ].map((cat) => (
            <div
              key={cat.label}
              className="rounded-xl glass-strong p-3 text-center transition hover:border-violet-200"
            >
              <span className="text-xl">{cat.icon}</span>
              <p className="mt-1 text-xs font-medium text-stone-700">{cat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Cook / Seller CTA */}
      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-3xl glass-strong p-6">
          <span className="text-3xl">👨‍🍳</span>
          <h3 className="mt-3 text-base font-bold text-stone-900">Cook from home</h3>
          <p className="mt-1 text-sm text-stone-500">
            Turn your kitchen into a business. Set your schedule, list your dishes, and cook for your neighbourhood.
          </p>
          <div className="mt-4">
            <LinkButton href={isLoggedIn ? "/cook/onboarding" : "/sign-up"} size="sm">
              Start your kitchen
            </LinkButton>
          </div>
        </div>
        <div className="rounded-3xl glass-strong p-6">
          <span className="text-3xl">🛍</span>
          <h3 className="mt-3 text-base font-bold text-stone-900">Sell what you make</h3>
          <p className="mt-1 text-sm text-stone-500">
            Your handmade goods deserve an audience. List your crafts, clothing, decor, or packaged food.
          </p>
          <div className="mt-4">
            <LinkButton href={isLoggedIn ? "/seller/onboarding" : "/sign-up"} size="sm" variant="secondary">
              Open your shop
            </LinkButton>
          </div>
        </div>
      </section>

      {/* Footer note */}
      <footer className="pb-4 text-center text-[11px] text-stone-400">
        <span className="gradient-text-animate font-bold">HomeMade</span>
        {" "}&middot;{" "}
        <a href="/terms" className="hover:text-violet-600">Terms</a>
        {" "}&middot;{" "}
        <a href="/privacy" className="hover:text-violet-600">Privacy</a>
      </footer>
    </div>
  );
}
