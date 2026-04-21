import Link from "next/link";
import { notFound } from "next/navigation";

import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ProductForm } from "@/app/seller/products/product-form";
import { adminCreateProduct } from "@/app/admin/actions";

export const metadata = { title: "Add product — HomeMade Admin" };

export default async function AdminNewProductPage({
  params,
}: {
  params: Promise<{ sellerId: string }>;
}) {
  await requireRole("admin");
  const { sellerId } = await params;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any;

  const { data: seller } = await supabase
    .from("seller_profiles")
    .select("shop_name, category")
    .eq("id", sellerId)
    .maybeSingle();
  if (!seller) notFound();

  return (
    <div className="space-y-6">
      <Link
        href={`/admin/sellers/${sellerId}`}
        className="text-sm text-stone-400 transition hover:text-violet-600"
      >
        &larr; Back to {seller.shop_name}
      </Link>
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Add product</h1>
        <p className="mt-1 text-sm text-stone-500">
          for <span className="font-medium text-stone-800">{seller.shop_name}</span>
        </p>
      </div>
      <ProductForm
        mode="create"
        defaultCategory={seller.category}
        action={adminCreateProduct.bind(null, sellerId)}
      />
    </div>
  );
}
