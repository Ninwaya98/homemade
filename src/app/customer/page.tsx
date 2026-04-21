import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { LinkButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/Card";
import { HorizontalScroll } from "@/components/feed/HorizontalScroll";
import { SectionHeader } from "@/components/feed/SectionHeader";
import { ProductCard } from "@/components/feed/ProductCard";
import { CookCard } from "@/components/feed/CookCard";
import { CategoryPills } from "@/components/feed/CategoryPills";
import { DynamicBackground } from "@/components/feed/DynamicBackground";
import { ZoneWrapper } from "@/components/feed/ZoneWrapper";
import { TipsSection } from "./_components/TipsSection";
import { ShopCTASection } from "./_components/ShopCTASection";

export const metadata = {
  title: "HomeMade -- Handmade goods, made by real people",
};

export default async function FeedPage() {
  const profile = await getCurrentProfile();
  const isLoggedIn = !!profile;
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;

  const [
    { data: products },
    { data: topSellers },
  ] = await Promise.all([
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

  // Check if user owns a seller shop
  let hasSellerShop = false;
  let sellerStatus: string | null = null;
  let sellerShopName: string | null = null;
  if (isLoggedIn) {
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

  const hasContent = (products ?? []).length > 0 || (topSellers ?? []).length > 0;

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
                Handmade goods from your neighbourhood
              </p>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-black text-stone-900">
                Handmade, from your{" "}
                <span className="gradient-text-animate">neighbourhood</span>
              </h1>
              <p className="mt-1 text-sm text-stone-500">
                Handmade goods from local artisans.
              </p>
            </>
          )}
        </header>

        <CategoryPills />

        {!hasContent && (
          <EmptyState
            title="Our marketplace is just getting started"
            body="Check back soon — sellers are setting up!"
            action={<LinkButton href="/seller/onboarding">Open your shop</LinkButton>}
          />
        )}

        {/* ════════════ HomeMade Art ════════════ */}
        {((products ?? []).length > 0 || (topSellers ?? []).length > 0) && (
          <ZoneWrapper>
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

        {/* ════════════ Tips ════════════ */}
        <TipsSection />

        {/* Seller — Dashboard or CTA */}
        <ShopCTASection
          isLoggedIn={isLoggedIn}
          hasSellerShop={hasSellerShop}
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
