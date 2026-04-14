import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { todayIso, isoDow, formatPrice } from "@/lib/constants";
import { LinkButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/Card";
import { HorizontalScroll } from "@/components/feed/HorizontalScroll";
import { SectionHeader } from "@/components/feed/SectionHeader";
import { DishCard } from "@/components/feed/DishCard";
import { ProductCard } from "@/components/feed/ProductCard";
import { CookCard } from "@/components/feed/CookCard";
import { CategoryPills } from "@/components/feed/CategoryPills";
import { DynamicBackground } from "@/components/feed/DynamicBackground";
import { ZoneWrapper } from "@/components/feed/ZoneWrapper";
import { TipsSection } from "./_components/TipsSection";
import { ShopCTASection } from "./_components/ShopCTASection";

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
    { data: topSellers },
  ] = await Promise.all([
    // Open cooks (approved + available)
    sb
      .from("cook_profiles")
      .select(`
        id, cuisine_tags, photo_url, avg_rating, rating_count, score, like_count, dislike_count, is_available, weekly_schedule,
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
        cook_profiles!inner(id, avg_rating, score, like_count, dislike_count, rating_count, status, profiles!cook_profiles_id_fkey!inner(full_name))
      `)
      .eq("status", "active")
      .eq("cook_profiles.status", "approved")
      .order("created_at", { ascending: false })
      .limit(12),

    // Products
    sb
      .from("products")
      .select(`
        id, name, price_cents, photo_urls, category,
        seller_profiles!inner(id, shop_name, avg_rating, rating_count, score, like_count, dislike_count, status, profiles!seller_profiles_id_fkey!inner(full_name))
      `)
      .eq("status", "active")
      .eq("seller_profiles.status", "approved")
      .order("created_at", { ascending: false })
      .limit(12),

    // Top sellers (by score)
    sb
      .from("seller_profiles")
      .select(`id, shop_name, photo_url, category, avg_rating, rating_count, score, like_count, dislike_count, profiles!seller_profiles_id_fkey!inner(full_name, location)`)
      .eq("status", "approved")
      .order("score", { ascending: false, nullsFirst: false })
      .limit(4),
  ]);

  // Filter cooks open today
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const availableCooks = (openCooks ?? []).filter((c: any) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const hasOpenDay = (c.availability ?? []).some((a: any) => a.date === today && a.is_open);
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

  // Check if user owns shops
  let hasCookShop = false;
  let hasSellerShop = false;
  let cookStatus: string | null = null;
  let sellerStatus: string | null = null;
  let sellerShopName: string | null = null;
  if (isLoggedIn) {
    const { data: cp } = await supabase
      .from("cook_profiles")
      .select("status")
      .eq("id", profile.id)
      .maybeSingle();
    hasCookShop = !!cp;
    cookStatus = cp?.status ?? null;

    const { data: sp } = await sb
      .from("seller_profiles")
      .select("status, shop_name")
      .eq("id", profile.id)
      .maybeSingle();
    hasSellerShop = !!sp;
    sellerStatus = sp?.status ?? null;
    sellerShopName = sp?.shop_name ?? null;
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const hasContent =
    availableCooks.length > 0 ||
    (popularDishes ?? []).length > 0 ||
    (products ?? []).length > 0;

  // Interleave dishes + products for the mixed "Discover more" zone
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mixedItems: { type: "dish" | "product"; data: any }[] = [];
  const dishes6 = (popularDishes ?? []).slice(0, 6);
  const prods6 = (products ?? []).slice(0, 6);
  for (let i = 0; i < Math.max(dishes6.length, prods6.length); i++) {
    if (i < dishes6.length) mixedItems.push({ type: "dish", data: dishes6[i] });
    if (i < prods6.length) mixedItems.push({ type: "product", data: prods6[i] });
  }

  return (
    <>
      <DynamicBackground />

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

        {/* ════════════ ZONE 1: HomeMade Food (Rose) ════════════ */}
        {((popularDishes ?? []).length > 0 || availableCooks.length > 0) && (
          <ZoneWrapper zone="food">
            <SectionHeader title="HomeMade Food" seeAllHref="/customer/kitchen" tone="rose" />

            {/* Popular Dishes — promoted first */}
            {(popularDishes ?? []).length > 0 && (
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
                    cookScore={d.cook_profiles?.score ?? null}
                    cookReviewCount={(d.cook_profiles?.like_count ?? 0) + (d.cook_profiles?.dislike_count ?? 0) || d.cook_profiles?.rating_count}
                    href={isLoggedIn ? `/customer/order/${d.id}` : `/customer/cooks/${d.cook_profiles?.id}`}
                  />
                ))}
              </HorizontalScroll>
            )}

            {/* Top Kitchens */}
            {availableCooks.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-rose-700">Top kitchens</h3>
                <HorizontalScroll>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {availableCooks.slice(0, 4).map((c: any) => (
                    <CookCard
                      key={c.id}
                      cook={{
                        name: c.profiles?.full_name ?? "Cook",
                        photo_url: c.photo_url,
                        location: c.profiles?.location ?? null,
                        cuisineTags: c.cuisine_tags,
                        avg_rating: c.avg_rating,
                        rating_count: c.rating_count,
                        score: c.score,
                        like_count: c.like_count,
                        dislike_count: c.dislike_count,
                      }}
                      href={`/customer/cooks/${c.id}`}
                      type="cook"
                      isOpen
                    />
                  ))}
                </HorizontalScroll>
              </div>
            )}
          </ZoneWrapper>
        )}

        {/* ════════════ ZONE 2: HomeMade Art (Blue) ════════════ */}
        {((products ?? []).length > 0 || (topSellers ?? []).length > 0) && (
          <ZoneWrapper zone="art">
            <SectionHeader title="HomeMade Art" seeAllHref="/customer/market" tone="sky" />

            {/* Featured Products */}
            {(products ?? []).length > 0 && (
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
                    sellerScore={p.seller_profiles?.score ?? null}
                    sellerReviewCount={(p.seller_profiles?.like_count ?? 0) + (p.seller_profiles?.dislike_count ?? 0) || p.seller_profiles?.rating_count}
                    href={isLoggedIn ? `/customer/market/order/${p.id}` : `/customer/market/sellers/${p.seller_profiles?.id}`}
                  />
                ))}
              </HorizontalScroll>
            )}

            {/* Top Sellers */}
            {(topSellers ?? []).length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-sky-700">Top sellers</h3>
                <HorizontalScroll>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {(topSellers ?? []).map((s: any) => (
                    <CookCard
                      key={s.id}
                      cook={{
                        name: s.profiles?.full_name ?? "Seller",
                        shopName: s.shop_name,
                        photo_url: s.photo_url,
                        location: s.profiles?.location ?? null,
                        avg_rating: s.avg_rating,
                        rating_count: s.rating_count,
                        score: s.score,
                        like_count: s.like_count,
                        dislike_count: s.dislike_count,
                      }}
                      href={`/customer/market/sellers/${s.id}`}
                      type="seller"
                    />
                  ))}
                </HorizontalScroll>
              </div>
            )}
          </ZoneWrapper>
        )}

        {/* ════════════ ZONE 3: Discover More (Mixed) ════════════ */}
        {mixedItems.length > 0 && (
          <ZoneWrapper zone="mixed">
            <SectionHeader title="Discover more" tone="violet" />

            <div className="grid grid-cols-2 gap-3">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {mixedItems.map((item: any, i: number) =>
                item.type === "dish" ? (
                  <DishCard
                    key={`md-${item.data.id}`}
                    dish={{
                      id: item.data.id,
                      name: item.data.name,
                      price_cents: item.data.price_cents,
                      photo_url: item.data.photo_url,
                      allergens: item.data.allergens ?? [],
                      portion_sizes: item.data.portion_sizes ?? null,
                    }}
                    cookName={item.data.cook_profiles?.profiles?.full_name ?? "Cook"}
                    href={isLoggedIn ? `/customer/order/${item.data.id}` : `/customer/cooks/${item.data.cook_profiles?.id}`}
                    className="!w-full card-tint-rose"
                  />
                ) : (
                  <ProductCard
                    key={`mp-${item.data.id}`}
                    product={{
                      id: item.data.id,
                      name: item.data.name,
                      price_cents: item.data.price_cents,
                      photo_urls: item.data.photo_urls ?? [],
                      category: item.data.category,
                    }}
                    sellerName={item.data.seller_profiles?.shop_name ?? "Seller"}
                    href={isLoggedIn ? `/customer/market/order/${item.data.id}` : `/customer/market/sellers/${item.data.seller_profiles?.id}`}
                    className="!w-full card-tint-sky"
                  />
                ),
              )}
            </div>
          </ZoneWrapper>
        )}

        {/* ════════════ Tips ════════════ */}
        <TipsSection />

        {/* Cook / Seller — Dashboard or CTA */}
        <ShopCTASection
          isLoggedIn={isLoggedIn}
          hasCookShop={hasCookShop}
          hasSellerShop={hasSellerShop}
          cookStatus={cookStatus}
          sellerStatus={sellerStatus}
          sellerShopName={sellerShopName}
        />

        {/* Footer */}
        <footer className="pb-4 text-center text-[11px] text-stone-400">
          <span className="gradient-text-animate font-bold">HomeMade</span>
          {" "}&middot;{" "}
          <a href="/terms" className="hover:text-violet-600">Terms</a>
          {" "}&middot;{" "}
          <a href="/privacy" className="hover:text-violet-600">Privacy</a>
        </footer>
      </div>
    </>
  );
}
