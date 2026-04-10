import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { ProductForm } from "../product-form";

export const metadata = {
  title: "New product — HomeMade Market",
};

export default async function NewProductPage() {
  const profile = await requireRole("seller");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any;

  const { data: sellerProfile } = await supabase
    .from("seller_profiles")
    .select("status, category")
    .eq("id", profile.id)
    .single();

  if (!sellerProfile || sellerProfile.status !== "approved") {
    return (
      <p className="text-sm text-stone-500">
        You need to be approved before adding products.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-stone-900">Add a product</h1>
      <ProductForm mode="create" defaultCategory={sellerProfile.category} />
    </div>
  );
}
