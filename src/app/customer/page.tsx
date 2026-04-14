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

        <section className="relative overflow-hidden rounded-3xl glass-strong !border-transparent p-6 sm:p-8 space-y-6">
          {/* Purple accent lines — clipped by overflow-hidden to follow the box's curves */}
          <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-[3px] bg-violet-300/60" />
          <div className="pointer-events-none absolute left-0 top-0 right-0 h-[3px] bg-violet-300/60" />
          <div className="pointer-events-none absolute inset-0 rounded-3xl" style={{background:"linear-gradient(135deg, rgba(196,181,253,0.2) 0%, transparent 35%)"}} />

          <div className="relative">
            {/* Header */}
            <div className="text-center mb-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-violet-500">Good to know</p>
              <h2 className="mt-1 text-xl font-bold text-stone-900">Tips</h2>
            </div>

            {/* Tip 1: How it works */}
            <div className="mb-6">
              <h3 className="text-sm font-bold text-violet-700 mb-3">How it works</h3>
              <div className="grid gap-2.5 sm:grid-cols-3">
                <div className="flex items-start gap-3 rounded-xl bg-violet-50/50 p-3.5">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-200/60 text-[11px] font-bold text-violet-700">1</span>
                  <div>
                    <p className="text-xs font-semibold text-stone-800">Browse</p>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-stone-500">Search cooks and sellers by name, cuisine, or category.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-xl bg-violet-50/50 p-3.5">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-200/60 text-[11px] font-bold text-violet-700">2</span>
                  <div>
                    <p className="text-xs font-semibold text-stone-800">Order</p>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-stone-500">Pick portions, choose a day, add to basket. Allergens listed on every dish.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-xl bg-violet-50/50 p-3.5">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-200/60 text-[11px] font-bold text-violet-700">3</span>
                  <div>
                    <p className="text-xs font-semibold text-stone-800">Enjoy</p>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-stone-500">Pick up or get delivery. Rate your experience to help the community.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-violet-100/60 my-5" />

            {/* Tip 2: Ratings */}
            <div className="mb-6">
              <h3 className="text-sm font-bold text-violet-700 mb-3">Ratings</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-start gap-3 rounded-xl bg-violet-50/50 p-3.5">
                    <svg className="h-4 w-4 shrink-0 mt-0.5 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017a2 2 0 01-.95-.24l-3.296-1.882V12m10-2V6a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905a3.61 3.61 0 01-.608 2.003L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2" />
                    </svg>
                    <p className="text-[11px] leading-relaxed text-stone-600">
                      <span className="font-semibold text-stone-800">Thumbs up or down</span> — simple and honest. Leave a comment to help cooks improve.
                    </p>
                  </div>
                  <div className="flex items-start gap-3 rounded-xl bg-violet-50/50 p-3.5">
                    <svg className="h-4 w-4 shrink-0 mt-0.5 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    <p className="text-[11px] leading-relaxed text-stone-600">
                      <span className="font-semibold text-stone-800">Scores improve</span> — when cooks address your feedback, resolved ratings lift their score.
                    </p>
                  </div>
                </div>
                {/* Score bar demo */}
                <div className="rounded-xl bg-violet-50/50 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-400 mb-2.5">Score example</p>
                  <div className="space-y-2">
                    {[
                      { label: "Excellent", score: 94 },
                      { label: "Great", score: 78 },
                      { label: "Good", score: 62 },
                      { label: "Needs work", score: 35 },
                    ].map((item) => {
                      const hue = Math.round(item.score * 1.2);
                      const color = `hsl(${hue}, 70%, 45%)`;
                      return (
                        <div key={item.label} className="flex items-center gap-2">
                          <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-stone-100">
                            <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${item.score}%`, backgroundColor: color }} />
                          </div>
                          <span className="w-6 text-right text-[10px] font-bold" style={{ color }}>{item.score}</span>
                          <span className="w-16 text-[9px] text-stone-400">{item.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-violet-100/60 my-5" />

            {/* Tip 3: Colors */}
            <div>
              <h3 className="text-sm font-bold text-violet-700 mb-3">Our colours</h3>
              <div className="grid grid-cols-3 gap-2.5">
                <div className="rounded-xl p-3.5 text-center bg-rose-50/70 border border-rose-200/40">
                  <div className="mx-auto h-3 w-12 rounded-full bg-rose-300/70 mb-2" />
                  <p className="text-[11px] font-semibold text-rose-700">Rose</p>
                  <p className="text-[10px] text-rose-500/80 mt-0.5">HomeMade Food</p>
                </div>
                <div className="rounded-xl p-3.5 text-center bg-sky-50/70 border border-sky-200/40">
                  <div className="mx-auto h-3 w-12 rounded-full bg-sky-300/70 mb-2" />
                  <p className="text-[11px] font-semibold text-sky-700">Blue</p>
                  <p className="text-[10px] text-sky-500/80 mt-0.5">HomeMade Art</p>
                </div>
                <div className="rounded-xl p-3.5 text-center bg-violet-50/70 border border-violet-200/40">
                  <div className="mx-auto h-3 w-12 rounded-full bg-violet-300/70 mb-2" />
                  <p className="text-[11px] font-semibold text-violet-700">Purple</p>
                  <p className="text-[10px] text-violet-500/80 mt-0.5">Both combined</p>
                </div>
              </div>
              <p className="mt-2.5 text-center text-[11px] text-stone-400">
                Rose + Blue = Purple — that&apos;s why HomeMade is all three.
              </p>
            </div>
          </div>
        </section>

        {/* Cook / Seller — Dashboard or CTA */}
        <section className="grid gap-4 sm:grid-cols-2">
          {hasCookShop ? (
            <div className="relative overflow-hidden rounded-3xl glass-strong p-6">
              <div className="pointer-events-none absolute inset-0 rounded-3xl border-l-[3px] border-t-[3px] border-rose-300/60" />
              <div className="pointer-events-none absolute inset-0 rounded-3xl" style={{background:"linear-gradient(135deg, rgba(254,205,211,0.25) 0%, transparent 40%)"}} />
              <div className="relative">
                <h3 className="text-base font-bold text-stone-900">Your Kitchen</h3>
                <span className={`inline-block mt-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                  cookStatus === "approved" ? "bg-emerald-50 text-emerald-700" : cookStatus === "suspended" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"
                }`}>
                  {cookStatus}
                </span>
                <p className="mt-3 text-sm text-stone-500">
                  Manage your dishes, schedule, orders, and earnings.
                </p>
                <div className="mt-4 flex gap-2">
                  <LinkButton href="/cook" size="sm">
                    Go to dashboard
                  </LinkButton>
                  {cookStatus === "approved" && (
                    <LinkButton href="/cook/orders" size="sm" variant="secondary">
                      Orders
                    </LinkButton>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="relative overflow-hidden rounded-3xl glass-strong p-6">
              <div className="pointer-events-none absolute inset-0 rounded-3xl border-l-[3px] border-t-[3px] border-rose-300/60" />
              <div className="pointer-events-none absolute inset-0 rounded-3xl" style={{background:"linear-gradient(135deg, rgba(254,205,211,0.25) 0%, transparent 40%)"}} />
              <div className="relative">
                <h3 className="text-base font-bold text-stone-900">Cook from home</h3>
                <p className="mt-1 text-sm text-stone-500">
                  Turn your kitchen into a business. Set your schedule, list your dishes, and cook for your neighbourhood.
                </p>
                <div className="mt-4">
                  <LinkButton href={isLoggedIn ? "/cook/onboarding" : "/sign-up"} size="sm">
                    Start your kitchen
                  </LinkButton>
                </div>
              </div>
            </div>
          )}

          {hasSellerShop ? (
            <div className="relative overflow-hidden rounded-3xl glass-strong p-6">
              <div className="pointer-events-none absolute inset-0 rounded-3xl border-l-[3px] border-t-[3px] border-sky-300/60" />
              <div className="pointer-events-none absolute inset-0 rounded-3xl" style={{background:"linear-gradient(135deg, rgba(186,230,253,0.25) 0%, transparent 40%)"}} />
              <div className="relative">
                <h3 className="text-base font-bold text-stone-900">Your Shop</h3>
                <span className={`inline-block mt-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                  sellerStatus === "approved" ? "bg-emerald-50 text-emerald-700" : sellerStatus === "suspended" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"
                }`}>
                  {sellerStatus}
                </span>
                <p className="mt-3 text-sm text-stone-500">
                  Manage your products, orders, and earnings.
                </p>
                <div className="mt-4 flex gap-2">
                  <LinkButton href="/seller" size="sm" variant="secondary">
                    Go to dashboard
                  </LinkButton>
                  {sellerStatus === "approved" && (
                    <LinkButton href="/seller/orders" size="sm" variant="secondary">
                      Orders
                    </LinkButton>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="relative overflow-hidden rounded-3xl glass-strong p-6">
              <div className="pointer-events-none absolute inset-0 rounded-3xl border-l-[3px] border-t-[3px] border-sky-300/60" />
              <div className="pointer-events-none absolute inset-0 rounded-3xl" style={{background:"linear-gradient(135deg, rgba(186,230,253,0.25) 0%, transparent 40%)"}} />
              <div className="relative">
                <h3 className="text-base font-bold text-stone-900">Sell what you make</h3>
                <p className="mt-1 text-sm text-stone-500">
                  Your handmade goods deserve an audience. List your crafts, clothing, decor, or packaged food.
                </p>
                <div className="mt-4">
                  <LinkButton href={isLoggedIn ? "/seller/onboarding" : "/sign-up"} size="sm" variant="secondary">
                    Open your shop
                  </LinkButton>
                </div>
              </div>
            </div>
          )}
        </section>

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
