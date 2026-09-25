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

  // Status and timestamps in one write, conditional on the status we
  // checked, so a double click or a simultaneous cancel cannot apply twice.
  const extras = buildStatusExtras(status, estimatedReadyTime);
  const { data: updated } = await supabase
    .from("orders")
    .update({ status, ...extras })
    .eq("id", orderId)
    .eq("status", order.status)
    .select("id");
  if (!updated?.length) return;

  // Restore stock when seller cancels (atomic, once per order).
  if (status === "cancelled" && order.product_id) {
    await supabase.rpc("restock_cancelled_order", { p_order_id: orderId });
  }

  revalidatePath("/seller/orders");
  revalidatePath(`/seller/orders/${orderId}`);
}
