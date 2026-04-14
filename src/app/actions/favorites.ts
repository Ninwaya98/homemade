"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function toggleFavorite(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const dishId = formData.get("dishId") as string | null;
  const productId = formData.get("productId") as string | null;
  if (!dishId && !productId) return { error: "Missing item" };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;

  // Race-safe toggle: try to delete first. If nothing was deleted, insert.
  // This avoids the SELECT-then-INSERT/DELETE race where a concurrent request
  // could create a duplicate between the check and the write.
  const col = dishId ? "dish_id" : "product_id";
  const val = dishId || productId;

  const { data: deleted } = await sb
    .from("favorites")
    .delete()
    .eq("user_id", user.id)
    .eq(col, val)
    .select("id");

  if (!deleted || deleted.length === 0) {
    // Didn't exist — insert it
    await sb.from("favorites").insert({
      user_id: user.id,
      ...(dishId ? { dish_id: dishId } : { product_id: productId }),
    });
  }

  revalidatePath("/customer");
  return { success: true };
}

export async function getUserFavoriteIds() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { dishIds: [] as string[], productIds: [] as string[] };

  const sb = supabase as any;
  const { data: favs } = await sb.from("favorites").select("dish_id, product_id").eq("user_id", user.id);

  const dishIds = (favs ?? []).filter((f: any) => f.dish_id).map((f: any) => f.dish_id as string);
  const productIds = (favs ?? []).filter((f: any) => f.product_id).map((f: any) => f.product_id as string);

  return { dishIds, productIds };
}
