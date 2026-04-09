"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { splitOrderTotal } from "@/lib/constants";

export type OrderFormState = { error?: string } | undefined;

export async function placeOrder(
  _state: OrderFormState,
  formData: FormData,
): Promise<OrderFormState> {
  const profile = await requireRole("customer");
  const supabase = await createClient();

  const dishId = String(formData.get("dish_id") ?? "");
  const quantity = Math.max(1, Math.min(20, Number(formData.get("quantity") ?? 1)));
  const type = String(formData.get("type") ?? "pickup") as "pickup" | "delivery";
  const scheduledFor = String(formData.get("scheduled_for") ?? "");
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const deliveryAddress = String(formData.get("delivery_address") ?? "").trim() || null;
  const allergenAck = formData.get("allergen_ack") === "on";

  if (!dishId || !scheduledFor) {
    return { error: "Missing dish or date." };
  }
  if (!allergenAck) {
    return { error: "Please confirm you've read the allergen information." };
  }

  // Pull dish for pricing.
  const { data: dish } = await supabase
    .from("dishes")
    .select("price_cents, cook_id, status")
    .eq("id", dishId)
    .single();
  if (!dish) return { error: "Dish not found." };

  const totalCents = dish.price_cents * quantity;
  const { commission, payout } = splitOrderTotal(totalCents);

  // Call the place_order RPC — it does all the locking + validation
  // (cook approved, dish active, day open, cap not reached, pre-order
  // cutoff respected) atomically and inserts the order row.
  const { data: orderId, error } = await supabase.rpc("place_order", {
    p_dish_id: dishId,
    p_quantity: quantity,
    p_type: type,
    p_scheduled_for: scheduledFor,
    p_total_cents: totalCents,
    p_commission_cents: commission,
    p_cook_payout_cents: payout,
    p_notes: notes ?? undefined,
  });

  if (error) {
    return { error: error.message.replace(/^.*: /, "") };
  }

  // STRIPE PLACEHOLDER: in real life we'd create a PaymentIntent here,
  // hand it to the client to confirm, and only flip the order to
  // "confirmed" after the webhook fires. For the MVP we treat the
  // order as paid immediately.

  // Save delivery address if provided (column from migration 006, not in generated types yet)
  if (deliveryAddress && type === "delivery") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("orders") as any)
      .update({ delivery_address: deliveryAddress })
      .eq("id", orderId);
  }

  revalidatePath("/customer/orders");
  redirect(`/customer/orders/${orderId}?placed=1`);
}

// Customer cancels a still-pending order.
export async function cancelOrder(orderId: string) {
  const profile = await requireRole("customer");
  const supabase = await createClient();
  const { data: order } = await supabase
    .from("orders")
    .select("status, customer_id, cook_id, dish_id, scheduled_for, quantity")
    .eq("id", orderId)
    .single();
  if (!order || order.customer_id !== profile.id) return;
  if (order.status !== "pending") return;

  await supabase.from("orders").update({ status: "cancelled" }).eq("id", orderId);

  // Refund the portions back to the day.
  const { data: avail } = await supabase
    .from("availability")
    .select("portions_taken")
    .eq("cook_id", order.cook_id)
    .eq("date", order.scheduled_for!)
    .single();
  if (avail) {
    await supabase
      .from("availability")
      .update({ portions_taken: Math.max(0, avail.portions_taken - order.quantity) })
      .eq("cook_id", order.cook_id)
      .eq("date", order.scheduled_for!);
  }

  revalidatePath("/customer/orders");
  revalidatePath(`/customer/orders/${orderId}`);
}

// Customer leaves a review on a completed order.
export async function leaveReview(formData: FormData) {
  const profile = await requireRole("customer");
  const supabase = await createClient();

  const orderId = String(formData.get("order_id") ?? "");
  const rating = Math.max(1, Math.min(5, Number(formData.get("rating") ?? 0)));
  const text = String(formData.get("text") ?? "").trim() || null;

  if (!orderId || !rating) return;

  const { data: order } = await supabase
    .from("orders")
    .select("status, customer_id, cook_id")
    .eq("id", orderId)
    .single();
  if (!order || order.customer_id !== profile.id || order.status !== "completed") {
    return;
  }

  await supabase.from("reviews").upsert(
    {
      order_id: orderId,
      reviewer_id: profile.id,
      reviewee_id: order.cook_id,
      role: "customer",
      rating,
      text,
    },
    { onConflict: "order_id,role" },
  );

  // Recompute the cook's avg rating + count.
  const { data: stats } = await supabase
    .from("reviews")
    .select("rating")
    .eq("reviewee_id", order.cook_id)
    .eq("role", "customer");
  if (stats) {
    const count = stats.length;
    const avg = count
      ? Number((stats.reduce((s, r) => s + r.rating, 0) / count).toFixed(2))
      : 0;
    await supabase
      .from("cook_profiles")
      .update({ avg_rating: avg, rating_count: count })
      .eq("id", order.cook_id);
  }

  revalidatePath(`/customer/orders/${orderId}`);
  revalidatePath(`/customer/cooks/${order.cook_id}`);
}
