"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireSellerProfile } from "@/lib/auth";
import { isTransitionAllowed, buildStatusExtras } from "@/lib/order-utils";

// =====================================================================
// Order management (seller side)
// =====================================================================

export async function setSellerOrderStatus(
  orderId: string,
  status: "confirmed" | "ready" | "completed" | "cancelled",
  estimatedReadyTime?: string,
) {
  const { profile } = await requireSellerProfile();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any;

  const { data: order } = await supabase
    .from("orders")
    .select("status, seller_id, quantity, product_id")
    .eq("id", orderId)
    .eq("vertical", "market")
    .single();
  if (!order || order.seller_id !== profile.id) return;

  if (!isTransitionAllowed(order.status, status)) return;

  await supabase.from("orders").update({ status }).eq("id", orderId);

  const extras = buildStatusExtras(status, estimatedReadyTime);
  if (Object.keys(extras).length > 0) {
    await supabase.from("orders").update(extras).eq("id", orderId);
  }

  // Restore stock when seller cancels.
  //
  // NOTE: Known race condition — if two cancellations for the same product run
  // concurrently, both may read the same `stock_quantity` and one restore could
  // be lost. A proper fix requires an atomic SQL increment (RPC). The current
  // approach is safe in that it never produces negative stock — the worst case
  // is stock being slightly lower than expected, which is a conservative failure
  // mode (seller sees fewer available than actual).
  if (status === "cancelled" && order.product_id) {
    const { data: product } = await supabase
      .from("products")
      .select("stock_quantity, status")
      .eq("id", order.product_id)
      .single();
    if (product) {
      const restoredStock = product.stock_quantity + order.quantity;
      const updates: Record<string, unknown> = {
        stock_quantity: restoredStock,
      };
      // Re-activate product if it was out of stock and now has inventory
      if (product.status === "out_of_stock" && restoredStock > 0) {
        updates.status = "active";
      }
      await supabase.from("products").update(updates).eq("id", order.product_id);
    }
  }

  revalidatePath("/seller/orders");
  revalidatePath(`/seller/orders/${orderId}`);
}
