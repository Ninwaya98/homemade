import Link from "next/link";
import { notFound } from "next/navigation";

import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ProductForm } from "@/app/seller/products/product-form";
import { adminUpdateProduct } from "@/app/admin/actions";

export const metadata = { title: "Edit product — HomeMade Admin" };

export default async function AdminEditProductPage({
  params,
}: {
  params: Promise<{ sellerId: string; productId: string }>;
}) {
  await requireRole("admin");
  const { sellerId, productId } = await params;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any;

  const [{ data: seller }, { data: product }] = await Promise.all([
    supabase
      .from("seller_profiles")
      .select("shop_name")
      .eq("id", sellerId)
      .maybeSingle(),
    supabase
      .from("products")
      .select(
        "id, name, description, price_cents, category, subcategory, materials, dimensions, condition, stock_quantity, photo_urls, ingredients",
      )
      .eq("id", productId)
      .eq("seller_id", sellerId)
      .maybeSingle(),
  ]);
  if (!seller || !product) notFound();

  return (
    <div className="space-y-6">
      <Link
        href={`/admin/sellers/${sellerId}`}
        className="text-sm text-stone-400 transition hover:text-violet-600"
      >
        &larr; Back to {seller.shop_name}
      </Link>
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Edit product</h1>
        <p className="mt-1 text-sm text-stone-500">
          {product.name} — {seller.shop_name}
        </p>
      </div>
      <ProductForm
        mode="edit"
        product={product}
        action={adminUpdateProduct.bind(null, sellerId, productId)}
      />
    </div>
  );
}
