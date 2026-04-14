"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireCookProfile } from "@/lib/auth";
import { portionSizePortions } from "@/lib/constants";
import { isTransitionAllowed, buildStatusExtras } from "@/lib/order-utils";

// =====================================================================
// Order management (cook side)
// =====================================================================

export async function setOrderStatus(
  orderId: string,
  status: "confirmed" | "ready" | "completed" | "cancelled",
  estimatedReadyTime?: string,
) {
  const { profile } = await requireCookProfile();
  const supabase = await createClient();

  // Allowed transitions enforced here (RLS allows the update, we shape the FSM).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: order } = await (supabase.from("orders") as any)
    .select("status, cook_id, quantity, scheduled_for, portion_size")
    .eq("id", orderId)
    .single();
  if (!order || order.cook_id !== profile.id) {
    return;
  }
  if (!isTransitionAllowed(order.status, status)) return;

  await supabase.from("orders").update({ status }).eq("id", orderId);

  const extras = buildStatusExtras(status, estimatedReadyTime);
  if (Object.keys(extras).length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("orders") as any).update(extras).eq("id", orderId);
  }

  // Refund portions when cook cancels an order (portion-size aware).
  //
  // NOTE: Known race condition — if two cancellations for the same cook+date
  // run concurrently, both may read the same `portions_taken` value and one
  // refund could be lost. A proper fix requires an atomic SQL decrement (RPC).
  // The Math.max(0, ...) guard ensures portions_taken never goes negative,
  // so the worst case is a slightly inflated portions_taken (fewer available
  // slots than expected), which is a safe failure mode.
  if (status === "cancelled" && order.scheduled_for) {
    const portionsPerUnit = portionSizePortions(order.portion_size ?? "");
    const totalPortions = order.quantity * portionsPerUnit;
    const { data: avail } = await supabase
      .from("availability")
      .select("portions_taken")
      .eq("cook_id", profile.id)
      .eq("date", order.scheduled_for)
      .single();
    if (avail) {
      const newPortionsTaken = Math.max(0, avail.portions_taken - totalPortions);
      await supabase
        .from("availability")
        .update({ portions_taken: newPortionsTaken })
        .eq("cook_id", profile.id)
        .eq("date", order.scheduled_for);
    }
  }

  revalidatePath("/cook/orders");
  revalidatePath(`/cook/orders/${orderId}`);
}
