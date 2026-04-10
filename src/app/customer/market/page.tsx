import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { EmptyState } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/Button";
import { formatPrice, PRODUCT_CATEGORIES, productCategoryLabel } from "@/lib/constants";

export const metadata = {
  title: "Market — HomeMade",
};

export default async function MarketBrowsePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  await requireRole("customer");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any;
  const sp = await searchParams;

  let sellersQuery = supabase
    .from("seller_profiles")
    .select(`
      id,
      shop_name,
      shop_description,
      category,
      photo_url,
      avg_rating,
      rating_count,
      profiles!seller_profiles_id_fkey!inner(full_name, location),
      products(id, name, description, price_cents, photo_urls, status, category, subcategory)
    `)
    .eq("status", "approved")
    .limit(30);

  if (sp.category) {
    sellersQuery = sellersQuery.eq("category", sp.category);
  }

  const { data: sellers } = await sellersQuery;

  const filtered = (sellers ?? [])
    .map((s: {
      id: string; shop_name: string; shop_description: string | null;
      category: string; photo_url: string | null; avg_rating: number;
      rating_count: number; profiles: { full_name?: string; location?: string | null };
      products: { id: string; name: string; price_cents: number; photo_urls: string[]; status: string; category: string; subcategory: string | null }[];
    }) => ({
      ...s,
      activeProducts: (s.products ?? []).filter((p) => p.status === "active"),
    }))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((s: any) => s.activeProducts.length > 0);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-stone-900">
          HomeMade Market
        </h1>
        <p className="mt-1 text-sm text-stone-500">Handmade goods from local artisans and makers</p>
      </header>

      {/* Category filter pills */}
      <div className="-mx-1 flex flex-wrap gap-1.5">
        <FilterPill href="/customer/market" active={!sp.category}>
          All
        </FilterPill>
        {PRODUCT_CATEGORIES.map((c) => (
          <FilterPill
            key={c.id}
            href={`/customer/market?category=${c.id}`}
            active={sp.category === c.id}
          >
            {c.label}
          </FilterPill>
        ))}
      </div>

      {filtered.length > 0 ? (
        <div className="space-y-5">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {filtered.map((seller: any) => (
            <article
              key={seller.id}
              className="card-hover overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-sm"
            >
              {/* Seller header */}
              <Link
                href={`/customer/market/sellers/${seller.id}`}
                className="flex items-start gap-4 p-5 transition hover:bg-stone-50/50"
              >
                {seller.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={seller.photo_url}
                    alt=""
                    className="h-16 w-16 flex-none rounded-2xl object-cover shadow-sm ring-2 ring-stone-200"
                  />
                ) : (
                  <div className="flex h-16 w-16 flex-none items-center justify-center rounded-2xl bg-gradient-to-br from-stone-100 to-stone-200 text-xl font-bold text-stone-600 shadow-sm">
                    {seller.shop_name[0]?.toUpperCase() ?? "?"}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-bold text-stone-900">
                    {seller.shop_name}
                  </h2>
                  <p className="text-sm text-stone-500">
                    {seller.profiles?.location ?? "—"}
                    {seller.rating_count > 0 && (
                      <span className="ml-1.5 inline-flex items-center gap-0.5 text-amber-600">
                        <span className="text-xs">★</span>
                        {Number(seller.avg_rating).toFixed(1)}
                        <span className="text-stone-400">({seller.rating_count})</span>
                      </span>
                    )}
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    <Badge tone="neutral">{productCategoryLabel(seller.category)}</Badge>
                  </div>
                  {seller.shop_description && (
                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-stone-600">
                      {seller.shop_description}
                    </p>
                  )}
                </div>
              </Link>

              {/* Products */}
              <div className="border-t border-stone-100 bg-gradient-to-b from-stone-50/50 to-stone-50 p-5">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-stone-400">
                  Products
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {seller.activeProducts.slice(0, 4).map((product: any) => (
                    <Link
                      key={product.id}
                      href={`/customer/market/order/${product.id}`}
                      className="group flex items-center gap-3 rounded-xl border border-stone-200/80 bg-white p-3 shadow-sm transition hover:border-amber-300 hover:shadow-md"
                    >
                      {product.photo_urls.length > 0 ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={product.photo_urls[0]}
                          alt=""
                          className="h-14 w-14 flex-none rounded-lg object-cover"
                        />
                      ) : (
                        <div className="flex h-14 w-14 flex-none items-center justify-center rounded-lg bg-stone-100 text-2xl">🛍</div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-stone-900 group-hover:text-amber-800">
                          {product.name}
                        </p>
                        <p className="text-sm font-medium text-amber-700">
                          {formatPrice(product.price_cents)}
                        </p>
                        {product.subcategory && (
                          <p className="mt-0.5 truncate text-[10px] text-stone-400">
                            {product.subcategory}
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
          title="No sellers match your filters"
          body={
            sp.category
              ? "Try removing the filter."
              : "As soon as sellers are approved, their products will appear here."
          }
          action={
            sp.category && (
              <LinkButton href="/customer/market" variant="secondary" size="sm">
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
