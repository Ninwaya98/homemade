import Link from "next/link";

import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import { DishCard } from "@/components/feed/DishCard";
import { ProductCard } from "@/components/feed/ProductCard";
import { SectionHeader } from "@/components/feed/SectionHeader";
import FavoriteButton from "@/components/ui/FavoriteButton";

export const metadata = { title: "My favorites — HomeMade" };

export default async function FavoritesPage() {
  const profile = await requireAuth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = (await createClient()) as any;

  // Fetch dish favorites with joined data
  const { data: dishFavs } = await sb
    .from("favorites")
    .select(
      `
      id, created_at, dish_id,
      dishes!inner(
        id, name, price_cents, photo_url, allergens, portion_sizes,
        cook_profiles!inner(
          id, avg_rating, rating_count, score, like_count, dislike_count,
          profiles!cook_profiles_id_fkey!inner(full_name)
        )
      )
    `,
    )
    .eq("user_id", profile.id)
    .not("dish_id", "is", null)
    .order("created_at", { ascending: false });

  // Fetch product favorites with joined data
  const { data: productFavs } = await sb
    .from("favorites")
    .select(
      `
      id, created_at, product_id,
      products!inner(
        id, name, price_cents, photo_urls, category,
        seller_profiles!inner(
          id, shop_name, avg_rating, rating_count, score, like_count, dislike_count,
          profiles!seller_profiles_id_fkey!inner(full_name)
        )
      )
    `,
    )
    .eq("user_id", profile.id)
    .not("product_id", "is", null)
    .order("created_at", { ascending: false });

  const dishes = dishFavs ?? [];
  const products = productFavs ?? [];
  const isEmpty = dishes.length === 0 && products.length === 0;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-stone-900">My favorites</h1>
        <p className="mt-1 text-sm text-stone-500">
          Dishes and products you have saved
        </p>
      </header>

      {isEmpty && (
        <EmptyState
          title="No favorites yet"
          body="Browse the Kitchen or Market and tap the heart icon to save items you love."
          action={
            <LinkButton href="/customer" size="sm">
              Browse HomeMade
            </LinkButton>
          }
        />
      )}

      {/* ════════════ Saved Dishes (Kitchen) ════════════ */}
      {dishes.length > 0 && (
        <section className="space-y-4">
          <SectionHeader
            title="Saved dishes"
            seeAllHref="/customer/kitchen"
            tone="rose"
          />
          <div className="grid grid-cols-2 gap-3">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {dishes.map((fav: any) => {
              const d = fav.dishes;
              return (
                <div key={fav.id} className="relative">
                  <DishCard
                    dish={{
                      id: d.id,
                      name: d.name,
                      price_cents: d.price_cents,
                      photo_url: d.photo_url,
                      allergens: d.allergens ?? [],
                      portion_sizes: d.portion_sizes ?? null,
                    }}
                    cookName={
                      d.cook_profiles?.profiles?.full_name ?? "Cook"
                    }
                    cookScore={d.cook_profiles?.score ?? null}
                    cookReviewCount={
                      (d.cook_profiles?.like_count ?? 0) +
                        (d.cook_profiles?.dislike_count ?? 0) ||
                      d.cook_profiles?.rating_count
                    }
                    href={`/customer/order/${d.id}`}
                    className="!w-full"
                  />
                  <div className="absolute right-2 top-2 z-10">
                    <FavoriteButton dishId={d.id} initialFavorited />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ════════════ Saved Products (Market) ════════════ */}
      {products.length > 0 && (
        <section className="space-y-4">
          <SectionHeader
            title="Saved products"
            seeAllHref="/customer/market"
            tone="sky"
          />
          <div className="grid grid-cols-2 gap-3">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {products.map((fav: any) => {
              const p = fav.products;
              return (
                <div key={fav.id} className="relative">
                  <ProductCard
                    product={{
                      id: p.id,
                      name: p.name,
                      price_cents: p.price_cents,
                      photo_urls: p.photo_urls ?? [],
                      category: p.category,
                    }}
                    sellerName={p.seller_profiles?.shop_name ?? "Seller"}
                    sellerScore={p.seller_profiles?.score ?? null}
                    sellerReviewCount={
                      (p.seller_profiles?.like_count ?? 0) +
                        (p.seller_profiles?.dislike_count ?? 0) ||
                      p.seller_profiles?.rating_count
                    }
                    href={`/customer/market/order/${p.id}`}
                    className="!w-full"
                  />
                  <div className="absolute right-2 top-2 z-10">
                    <FavoriteButton productId={p.id} initialFavorited />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
