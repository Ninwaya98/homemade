"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { splitOrderTotal, portionSizePortions } from "@/lib/constants";
import type { BasketItem } from "@/lib/types";

export type OrderFormState = { error?: string } | undefined;
export type ProductOrderFormState = { error?: string } | undefined;
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

// Customer leaves a review on a completed order (like/dislike model).
export async function leaveReview(formData: FormData) {
  const profile = await requireAuth();
  const supabase = await createClient();

  const orderId = String(formData.get("order_id") ?? "");
  const sentiment = String(formData.get("sentiment") ?? "") as "like" | "dislike";
  const text = String(formData.get("text") ?? "").trim() || null;

  if (text && text.length > 2000) return;

  if (!orderId || !["like", "dislike"].includes(sentiment)) return;

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

  // Recalculate profile score using the new utility
  const { recalculateProfileScore } = await import("@/lib/review-utils");
  const vertical = orderFull.vertical ?? "kitchen";
  await recalculateProfileScore(supabase, revieweeId, vertical);

  revalidatePath(`/customer/orders/${orderId}`);
  if (orderFull.cook_id) revalidatePath(`/customer/cooks/${orderFull.cook_id}`);
  if (orderFull.seller_id) revalidatePath(`/customer/market/sellers/${orderFull.seller_id}`);
}

// =====================================================================
// Market orders (product purchases)
// =====================================================================

export async function placeProductOrder(
  _state: ProductOrderFormState,
  formData: FormData,
): Promise<ProductOrderFormState> {
  const profile = await requireAuth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any;

  const productId = String(formData.get("product_id") ?? "");
  const quantity = Math.max(1, Math.min(20, Number(formData.get("quantity") ?? 1)));
  const type = String(formData.get("type") ?? "pickup") as "pickup" | "delivery";
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const deliveryAddress = String(formData.get("delivery_address") ?? "").trim() || null;

  if (notes && notes.length > 500) return { error: "Notes are too long (max 500 characters)." };
  if (deliveryAddress && deliveryAddress.length > 500) return { error: "Delivery address is too long (max 500 characters)." };

  if (!productId) return { error: "Missing product." };

  // Pull product for pricing
  const { data: product } = await supabase
    .from("products")
    .select("price_cents, seller_id, status, stock_quantity")
    .eq("id", productId)
    .single();
  if (!product) return { error: "Product not found." };
  if (product.stock_quantity < quantity) {
    return { error: `Only ${product.stock_quantity} left in stock.` };
  }

  const totalCents = product.price_cents * quantity;
  const { commission, payout } = splitOrderTotal(totalCents);

  const { data: orderId, error } = await supabase.rpc("place_product_order", {
    p_product_id: productId,
    p_quantity: quantity,
    p_type: type,
    p_total_cents: totalCents,
    p_commission_cents: commission,
    p_seller_payout_cents: payout,
    p_notes: notes ?? undefined,
  });

  if (error) {
    return { error: error.message.replace(/^.*: /, "") };
  }

  // Save delivery address if provided
  if (deliveryAddress && type === "delivery") {
    await supabase.from("orders").update({ delivery_address: deliveryAddress }).eq("id", orderId);
  }

  revalidatePath("/customer/orders");
  redirect(`/customer/orders/${orderId}?placed=1`);
}

export async function cancelProductOrder(orderId: string) {
  const profile = await requireAuth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any;

  const { data: order } = await supabase
    .from("orders")
    .select("status, customer_id, seller_id, product_id, quantity, vertical")
    .eq("id", orderId)
    .single();
  if (!order || order.customer_id !== profile.id || order.vertical !== "market") return;
  if (order.status !== "pending") return;

  await supabase.from("orders").update({ status: "cancelled", cancelled_at: new Date().toISOString() }).eq("id", orderId);

  // Restore stock
  if (order.product_id) {
    const { data: product } = await supabase
      .from("products")
      .select("stock_quantity, status")
      .eq("id", order.product_id)
      .single();
    if (product) {
      const updates: Record<string, unknown> = {
        stock_quantity: product.stock_quantity + order.quantity,
      };
      if (product.status === "out_of_stock") updates.status = "active";
      await supabase.from("products").update(updates).eq("id", order.product_id);
    }
  }

  revalidatePath("/customer/orders");
  revalidatePath(`/customer/orders/${orderId}`);
}
