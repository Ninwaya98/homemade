"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { reviewSchema } from "@/lib/schemas";

// Customer leaves a review on a completed order (like/dislike model).
export async function leaveReview(formData: FormData) {
  const profile = await requireAuth();
  const supabase = await createClient();

  const orderId = String(formData.get("order_id") ?? "");
  const sentiment = String(formData.get("sentiment") ?? "") as "like" | "dislike";
  const text = String(formData.get("text") ?? "").trim() || null;

  const parsed = reviewSchema.safeParse({ order_id: orderId, sentiment, text });
  if (!parsed.success) return;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: order } = await (supabase as any)
    .from("orders")
    .select("status, customer_id, cook_id, seller_id, vertical")
    .eq("id", orderId)
    .single();
  if (!order || order.customer_id !== profile.id || order.status !== "completed") {
    return;
  }

  // Determine reviewee — could be cook or seller depending on vertical
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const orderFull = order as any;
  const revieweeId = orderFull.cook_id ?? orderFull.seller_id;
  if (!revieweeId) return;

  // Backward-compat rating: like=5, dislike=1
  const rating = sentiment === "like" ? 5 : 1;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).from("reviews").upsert(
    {
      order_id: orderId,
      reviewer_id: profile.id,
      reviewee_id: revieweeId,
      role: "customer",
      sentiment,
      rating,
      text,
      resolution_status: "none",
    },
    { onConflict: "order_id,role" },
  );

  // Score recalculation handled by database trigger (migration 015)

  revalidatePath(`/customer/orders/${orderId}`);
  if (orderFull.cook_id) revalidatePath(`/customer/cooks/${orderFull.cook_id}`);
  if (orderFull.seller_id) revalidatePath(`/customer/market/sellers/${orderFull.seller_id}`);
}
