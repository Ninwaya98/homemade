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

  const sb = supabase as never;

  // Check existing
  let existing: { id: string }[] | null = null;
  if (dishId) {
    const { data } = await (sb as any).from("favorites").select("id").eq("user_id", user.id).eq("dish_id", dishId);
    existing = data;
  } else {
    const { data } = await (sb as any).from("favorites").select("id").eq("user_id", user.id).eq("product_id", productId);
    existing = data;
  }

  if (existing && existing.length > 0) {
    await (sb as any).from("favorites").delete().eq("id", existing[0].id);
  } else {
    const row: Record<string, string> = { user_id: user.id };
    if (dishId) row.dish_id = dishId;
    if (productId) row.product_id = productId;
    await (sb as any).from("favorites").insert(row);
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
