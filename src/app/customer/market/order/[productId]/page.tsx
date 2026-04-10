import Link from "next/link";
import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { ProductOrderForm } from "./order-form";

export const metadata = {
  title: "Order — HomeMade Market",
};

export default async function OrderProductPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  await requireRole("customer");
  const { productId } = await params;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any;

  const { data: product } = await supabase
    .from("products")
    .select(`
      *,
      seller_profiles!inner(id, status, shop_name, photo_url, profiles!seller_profiles_id_fkey!inner(full_name, location))
    `)
    .eq("id", productId)
    .eq("status", "active")
    .maybeSingle();

  if (!product || !product.seller_profiles || product.seller_profiles.status !== "approved") {
    notFound();
  }

  const seller = product.seller_profiles as {
    id: string;
    shop_name: string;
    photo_url: string | null;
    profiles: { full_name?: string; location?: string | null };
  };

  return (
    <div className="space-y-6">
      <Link
        href={`/customer/market/sellers/${seller.id}`}
        className="text-sm text-stone-400 transition hover:text-violet-600"
      >
        &larr; Back to {seller.shop_name}
      </Link>

      <ProductOrderForm
        product={{
          id: product.id,
          name: product.name,
          description: product.description,
          photo_urls: product.photo_urls,
          price_cents: product.price_cents,
          stock_quantity: product.stock_quantity,
          category: product.category,
          materials: product.materials,
          dimensions: product.dimensions,
          condition: product.condition,
          ingredients: product.ingredients,
        }}
        seller={{
          shop_name: seller.shop_name,
          full_name: seller.profiles.full_name ?? "—",
          location: seller.profiles.location ?? null,
          photo_url: seller.photo_url,
        }}
      />
    </div>
  );
}
