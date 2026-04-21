"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { splitOrderTotal } from "@/lib/constants";
import { checkOrderLimit } from "@/lib/rate-limit";

// =====================================================================
// Market orders (product purchases)
// =====================================================================

export type ProductOrderFormState = { error?: string } | undefined;

export async function placeProductOrder(
  _state: ProductOrderFormState,
  formData: FormData,
): Promise<ProductOrderFormState> {
  const profile = await requireAuth();

  // Throttle orders per user so someone can't spam the orders table
  // (30 orders / hour is well above any real customer's cadence).
  const limit = await checkOrderLimit(profile.id);
  if (!limit.success) {
    return { error: limit.message ?? "Too many order attempts. Try again later." };
  }

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
