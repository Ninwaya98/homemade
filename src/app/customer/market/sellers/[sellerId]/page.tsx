import Link from "next/link";
import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatPrice, productCategoryLabel } from "@/lib/constants";

export const metadata = {
  title: "Seller — HomeMade Market",
};

export default async function SellerDetailPage({
  params,
}: {
  params: Promise<{ sellerId: string }>;
}) {
  await requireRole("customer");
  const { sellerId } = await params;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any;

  const { data: seller } = await supabase
    .from("seller_profiles")
    .select(`
      *,
      profiles!seller_profiles_id_fkey!inner(full_name, location)
    `)
    .eq("id", sellerId)
    .eq("status", "approved")
    .maybeSingle();

  if (!seller) notFound();

  const { data: products } = await supabase
    .from("products")
    .select("*")
    .eq("seller_id", sellerId)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  const { data: reviews } = await supabase
    .from("reviews")
    .select("rating, text, created_at, profiles!reviews_reviewer_id_fkey(full_name)")
    .eq("reviewee_id", sellerId)
    .eq("role", "customer")
    .order("created_at", { ascending: false })
    .limit(10);

  const profile = seller.profiles as { full_name?: string; location?: string | null };

  return (
    <div className="space-y-6">
      <Link href="/customer/market" className="text-sm text-stone-400 transition hover:text-amber-700">
        &larr; Back to market
      </Link>

      {/* Seller hero */}
      <Card>
        <div className="flex items-start gap-4">
          {seller.photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={seller.photo_url}
              alt=""
              className="h-20 w-20 flex-none rounded-2xl object-cover shadow-sm ring-2 ring-stone-200"
            />
          ) : (
            <div className="flex h-20 w-20 flex-none items-center justify-center rounded-2xl bg-gradient-to-br from-stone-100 to-stone-200 text-2xl font-bold text-stone-600">
              {seller.shop_name[0]?.toUpperCase() ?? "?"}
            </div>
          )}
          <div>
            <h1 className="text-xl font-bold text-stone-900">{seller.shop_name}</h1>
            <p className="text-sm text-stone-500">
              by {profile.full_name} · {profile.location ?? "—"}
            </p>
            <div className="mt-1.5 flex items-center gap-2">
              <Badge tone="neutral">{productCategoryLabel(seller.category)}</Badge>
              {seller.rating_count > 0 && (
                <span className="text-sm text-amber-600">
                  ★ {Number(seller.avg_rating).toFixed(1)} ({seller.rating_count})
                </span>
              )}
            </div>
          </div>
        </div>
        {seller.shop_description && (
          <p className="mt-4 text-sm leading-relaxed text-stone-600">
            {seller.shop_description}
          </p>
        )}
      </Card>

      {/* Products */}
      <div>
        <h2 className="mb-3 text-lg font-bold text-stone-900">Products</h2>
        {products && products.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {products.map((p: {
              id: string; name: string; description: string | null;
              price_cents: number; photo_urls: string[]; stock_quantity: number;
              subcategory: string | null;
            }) => (
              <Link
                key={p.id}
                href={`/customer/market/order/${p.id}`}
                className="group card-hover overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-sm"
              >
                {p.photo_urls.length > 0 ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.photo_urls[0]}
                    alt=""
                    className="h-40 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-40 w-full items-center justify-center bg-stone-100 text-4xl">🛍</div>
                )}
                <div className="p-4">
                  <p className="font-semibold text-stone-900 group-hover:text-amber-800">{p.name}</p>
                  <p className="text-sm font-medium text-amber-700">{formatPrice(p.price_cents)}</p>
                  <p className="mt-1 text-xs text-stone-500">
                    {p.stock_quantity > 0 ? `${p.stock_quantity} in stock` : "Out of stock"}
                    {p.subcategory && ` · ${p.subcategory}`}
                  </p>
                  {p.description && (
                    <p className="mt-2 line-clamp-2 text-xs text-stone-500">{p.description}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-stone-500">No products listed yet.</p>
        )}
      </div>

      {/* Reviews */}
      {reviews && reviews.length > 0 && (
        <div>
          <h2 className="mb-3 text-lg font-bold text-stone-900">Reviews</h2>
          <div className="space-y-3">
            {reviews.map((r: { rating: number; text: string | null; created_at: string; profiles: { full_name?: string } }, i: number) => (
              <Card key={i}>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-stone-900">
                    {r.profiles?.full_name ?? "Customer"}
                  </p>
                  <p className="text-sm text-amber-600">{"★".repeat(r.rating)}</p>
                </div>
                {r.text && <p className="mt-2 text-sm text-stone-600">{r.text}</p>}
                <p className="mt-1 text-[10px] text-stone-400">
                  {new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </p>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
