import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { Card, EmptyState } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/Button";
import { formatPrice, productCategoryLabel } from "@/lib/constants";

export const metadata = {
  title: "Products — HomeMade Market",
};

export default async function SellerProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string; updated?: string }>;
}) {
  const profile = await requireRole("seller");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any;
  const sp = await searchParams;

  const { data: products } = await supabase
    .from("products")
    .select("*")
    .eq("seller_id", profile.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-stone-900">Products</h1>
        <LinkButton href="/seller/products/new" size="sm">
          Add product
        </LinkButton>
      </div>

      {(sp.created || sp.updated) && (
        <Card className="border-emerald-200 bg-emerald-50">
          <p className="text-sm font-medium text-emerald-900">
            Product {sp.created ? "created" : "updated"} successfully.
          </p>
        </Card>
      )}

      {products && products.length > 0 ? (
        <div className="space-y-3">
          {products.map((p: {
            id: string; name: string; price_cents: number; stock_quantity: number;
            status: string; category: string; photo_urls: string[];
          }) => (
            <Link key={p.id} href={`/seller/products/${p.id}`} className="block">
              <Card hover>
                <div className="flex items-center gap-4">
                  {p.photo_urls.length > 0 ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.photo_urls[0]}
                      alt=""
                      className="h-16 w-16 flex-none rounded-xl object-cover"
                    />
                  ) : (
                    <div className="flex h-16 w-16 flex-none items-center justify-center rounded-xl bg-stone-100 text-2xl">
                      🛍
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-stone-900">{p.name}</p>
                      <Badge tone={p.status === "active" ? "green" : p.status === "out_of_stock" ? "red" : "neutral"}>
                        {p.status === "out_of_stock" ? "out of stock" : p.status}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium text-amber-700">
                      {formatPrice(p.price_cents)}
                    </p>
                    <p className="text-xs text-stone-500">
                      {productCategoryLabel(p.category)} · {p.stock_quantity} in stock
                    </p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No products yet"
          body="Add your first product to start selling."
          action={
            <LinkButton href="/seller/products/new" size="sm">
              Add product
            </LinkButton>
          }
        />
      )}
    </div>
  );
}
