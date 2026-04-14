"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { splitOrderTotal, portionSizePortions } from "@/lib/constants";
import type { BasketItem } from "@/lib/types";

export type OrderFormState = { error?: string } | undefined;
export type CheckoutState =
  | { error?: string; ok?: boolean; orderCount?: number; errors?: string[] }
  | undefined;

export async function placeOrder(
  _state: OrderFormState,
  formData: FormData,
): Promise<OrderFormState> {
  const profile = await requireAuth();
  const supabase = await createClient();

  const dishId = String(formData.get("dish_id") ?? "");
  const quantity = Math.max(1, Math.min(20, Number(formData.get("quantity") ?? 1)));
  const type = String(formData.get("type") ?? "pickup") as "pickup" | "delivery";
  const scheduledFor = String(formData.get("scheduled_for") ?? "");
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const deliveryAddress = String(formData.get("delivery_address") ?? "").trim() || null;
  const allergenAck = formData.get("allergen_ack") === "on";

  if (notes && notes.length > 500) return { error: "Notes are too long (max 500 characters)." };
  if (deliveryAddress && deliveryAddress.length > 500) return { error: "Delivery address is too long (max 500 characters)." };

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

// Customer cancels a still-pending order (portion-size aware).
export async function cancelOrder(orderId: string) {
  const profile = await requireAuth();
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: order } = await (supabase.from("orders") as any)
    .select("status, customer_id, cook_id, dish_id, scheduled_for, quantity, portion_size")
    .eq("id", orderId)
    .single();
  if (!order || order.customer_id !== profile.id) return;
  if (order.status !== "pending") return;

  await supabase.from("orders").update({ status: "cancelled" }).eq("id", orderId);

  // Refund the portions back to the day (portion-size aware).
  const portionsPerUnit = portionSizePortions(order.portion_size ?? "");
  const totalPortions = order.quantity * portionsPerUnit;
  const { data: avail } = await supabase
    .from("availability")
    .select("portions_taken")
    .eq("cook_id", order.cook_id)
    .eq("date", order.scheduled_for!)
    .single();
  if (avail) {
    await supabase
      .from("availability")
      .update({ portions_taken: Math.max(0, avail.portions_taken - totalPortions) })
      .eq("cook_id", order.cook_id)
      .eq("date", order.scheduled_for!);
  }

  revalidatePath("/customer/orders");
  revalidatePath(`/customer/orders/${orderId}`);
}

// Checkout entire basket — places one order per basket item via the RPC.
export async function checkoutBasket(
  _state: CheckoutState,
  formData: FormData,
): Promise<CheckoutState> {
  const profile = await requireAuth();
  const supabase = await createClient();

  const itemsJson = String(formData.get("basket_items") ?? "[]");
  const type = String(formData.get("type") ?? "pickup") as "pickup" | "delivery";
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const deliveryAddress = String(formData.get("delivery_address") ?? "").trim() || null;

  if (notes && notes.length > 500) return { error: "Notes are too long (max 500 characters)." };
  if (deliveryAddress && deliveryAddress.length > 500) return { error: "Delivery address is too long (max 500 characters)." };

  let items: BasketItem[];
  try {
    items = JSON.parse(itemsJson);
  } catch {
    return { error: "Invalid basket data." };
  }
  if (!Array.isArray(items) || items.length === 0) {
    return { error: "Basket is empty." };
  }

  const orderIds: string[] = [];
  const errors: string[] = [];

  for (const item of items) {
    const totalCents = item.priceCents * item.quantity;
    const { commission, payout } = splitOrderTotal(totalCents);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: orderId, error } = await (supabase as any).rpc("place_order", {
      p_dish_id: item.dishId,
      p_quantity: item.quantity,
      p_type: type,
      p_scheduled_for: item.scheduledFor,
      p_total_cents: totalCents,
      p_commission_cents: commission,
      p_cook_payout_cents: payout,
      p_notes: notes ?? undefined,
      p_portion_size: item.portionSize ?? undefined,
    });

    if (error) {
      errors.push(`${item.dishName}: ${error.message.replace(/^.*: /, "")}`);
    } else {
      orderIds.push(orderId);
      if (deliveryAddress && type === "delivery") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from("orders") as any)
          .update({ delivery_address: deliveryAddress })
          .eq("id", orderId);
      }
    }
  }

  if (errors.length > 0 && orderIds.length === 0) {
    return { error: errors.join("\n") };
  }

  revalidatePath("/customer/orders");

  // Return success — client clears basket and redirects
  return {
    ok: true,
    orderCount: orderIds.length,
    errors: errors.length > 0 ? errors : undefined,
  };
}
