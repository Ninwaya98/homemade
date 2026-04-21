"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function toggleFavorite(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const productId = formData.get("productId") as string | null;
  if (!productId) return { error: "Missing item" };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;

  // Race-safe toggle: try to delete first. If nothing was deleted, insert.
  // This avoids the SELECT-then-INSERT/DELETE race where a concurrent request
  // could create a duplicate between the check and the write.
  const { data: deleted } = await sb
    .from("favorites")
    .delete()
    .eq("user_id", user.id)
    .eq("product_id", productId)
    .select("id");

  if (!deleted || deleted.length === 0) {
    // Didn't exist — insert it
    await sb.from("favorites").insert({
      user_id: user.id,
      product_id: productId,
    });
  }

  revalidatePath("/customer");
  return { success: true };
}

export async function getUserFavoriteIds() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { productIds: [] as string[] };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;
  const { data: favs } = await sb.from("favorites").select("product_id").eq("user_id", user.id);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const productIds = (favs ?? []).filter((f: any) => f.product_id).map((f: any) => f.product_id as string);

  return { productIds };
}
