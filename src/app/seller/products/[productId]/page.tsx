import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { ProductForm } from "../product-form";

export const metadata = {
  title: "Edit product — HomeMade Market",
};

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const profile = await requireRole("seller");
  const { productId } = await params;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any;

  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("id", productId)
    .eq("seller_id", profile.id)
    .maybeSingle();

  if (!product) notFound();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-stone-900">Edit product</h1>
      <ProductForm mode="edit" product={product} />
    </div>
  );
}
