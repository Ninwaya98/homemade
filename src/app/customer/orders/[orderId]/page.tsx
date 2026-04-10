import Link from "next/link";
import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/Button";
import { allergenLabel, dayLabel, formatPrice } from "@/lib/constants";
import { CancelOrderButton } from "./cancel-button";
import { ReviewForm } from "./review-form";

export const metadata = { title: "Order — HomeMade" };

export default async function CustomerOrderDetail({
  params,
  searchParams,
}: {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<{ placed?: string }>;
}) {
  const profile = await requireRole("customer");
  const { orderId } = await params;
  const { placed } = await searchParams;
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: order } = await (supabase as any)
    .from("orders")
    .select(`
      *,
      dishes(id, name, description, allergens, photo_url),
      cook_profiles!orders_cook_id_fkey(id, photo_url, profiles!cook_profiles_id_fkey(full_name, phone, location)),
      products(id, name, description, photo_urls, ingredients, category),
      seller_profiles!orders_seller_id_fkey(id, shop_name, photo_url, profiles!seller_profiles_id_fkey(full_name, phone, location))
    `)
    .eq("id", orderId)
    .eq("customer_id", profile.id)
    .maybeSingle();

  if (!order) notFound();

  // Cast — order is untyped due to multi-vertical joins
  const o = order as Record<string, unknown> & {
    id: string; status: string; quantity: number; total_cents: number;
    commission_cents: number; cook_payout_cents: number; type: string;
    scheduled_for: string | null; notes: string | null; created_at: string;
    vertical: string;
    delivery_address?: string | null;
    confirmed_at?: string | null; ready_at?: string | null;
    completed_at?: string | null; cancelled_at?: string | null;
    estimated_ready_time?: string | null;
  };

  const isMarket = o.vertical === "market";

  const dish = order.dishes as { id?: string; name?: string; description?: string | null; allergens?: string[]; photo_url?: string | null } | null;
  const product = order.products as { id?: string; name?: string; description?: string | null; photo_urls?: string[]; ingredients?: string | null; category?: string } | null;
  const cook = order.cook_profiles as {
    id: string;
    photo_url: string | null;
    profiles: { full_name?: string; phone?: string | null; location?: string | null };
  } | null;
  const seller = order.seller_profiles as {
    id: string;
    shop_name: string;
    photo_url: string | null;
    profiles: { full_name?: string; phone?: string | null; location?: string | null };
  } | null;

  // Unified values
  const itemName = isMarket ? product?.name : dish?.name;
  const itemId = isMarket ? product?.id : dish?.id;
  const itemPhotoUrl = isMarket ? (product?.photo_urls ?? [])[0] : dish?.photo_url;
  const providerName = isMarket ? seller?.shop_name : cook?.profiles?.full_name;
  const providerId = isMarket ? seller?.id : cook?.id;
  const providerPhoto = isMarket ? seller?.photo_url : cook?.photo_url;
  const providerLocation = isMarket ? seller?.profiles?.location : cook?.profiles?.location;
  const providerPhone = isMarket ? seller?.profiles?.phone : cook?.profiles?.phone;
  const providerLink = isMarket ? `/customer/market/sellers/${providerId}` : `/customer/cooks/${providerId}`;

  // If completed, has the customer left a review yet?
  let existingReview = null;
  if (order.status === "completed") {
    const { data } = await supabase
      .from("reviews")
      .select("rating, text")
      .eq("order_id", order.id)
      .eq("role", "customer")
      .maybeSingle();
    existingReview = data;
  }

  // Order placed celebration
  if (placed) {
    return (
      <div className="space-y-6">
        <div className="animate-fade-up rounded-2xl border border-emerald-200 bg-gradient-to-b from-emerald-50 to-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl">
            ✓
          </div>
          <h1 className="mt-4 text-2xl font-bold text-emerald-900">Order placed!</h1>
          <p className="mt-2 text-sm text-emerald-800/70">
            We&apos;ve let {providerName} know. They&apos;ll confirm it shortly.
          </p>

          <div className="mx-auto mt-6 max-w-xs rounded-xl border border-stone-200 bg-white p-4 text-left shadow-sm">
            <div className="flex items-center gap-3">
              {itemPhotoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={itemPhotoUrl} alt="" className="h-14 w-14 rounded-lg object-cover" />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-stone-100 text-xl">{isMarket ? "🛍" : "🍽"}</div>
              )}
              <div>
                <p className="text-sm font-semibold text-stone-900">
                  {o.quantity}× {itemName ?? "—"}
                </p>
                <p className="text-xs text-stone-500">
                  {o.scheduled_for ? dayLabel(o.scheduled_for) : o.type}
                </p>
                <p className="text-sm font-medium text-violet-600">{formatPrice(o.total_cents)}</p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-center gap-3">
            <LinkButton href="/customer" variant="secondary" size="sm">
              Browse more
            </LinkButton>
            <LinkButton href={`/customer/orders/${order.id}`} size="sm">
              View order
            </LinkButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link href="/customer/orders" className="text-sm text-stone-400 transition hover:text-violet-600">
        &larr; All orders
      </Link>

      {/* Order header */}
      <Card>
        <div className="flex items-start gap-4">
          {itemPhotoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={itemPhotoUrl} alt="" className="h-20 w-20 flex-none rounded-xl object-cover shadow-sm" />
          ) : (
            <div className="flex h-20 w-20 flex-none items-center justify-center rounded-xl bg-stone-100 text-2xl">{isMarket ? "🛍" : "🍽"}</div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-stone-900">
                {o.quantity}× {itemName ?? "—"}
              </h1>
              <Badge tone={statusTone(o.status)}>{o.status}</Badge>
              <Badge tone={isMarket ? "blue" : "amber"}>{isMarket ? "Market" : "Kitchen"}</Badge>
            </div>
            <p className="text-sm text-stone-500">
              {o.scheduled_for ? dayLabel(o.scheduled_for) : ""} {o.type}
            </p>
            {o.estimated_ready_time && (
              <p className="mt-1 text-sm font-medium text-violet-600">
                Estimated ready: {o.estimated_ready_time}
              </p>
            )}
            {!isMarket && dish?.allergens && dish.allergens.length > 0 && (
              <p className="mt-2 rounded-lg bg-violet-50 px-2.5 py-1.5 text-xs font-medium text-violet-900">
                Contains: {dish.allergens.map(allergenLabel).join(", ")}
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Status timeline */}
      <Card>
        <h2 className="text-sm font-bold text-stone-900">Order progress</h2>
        <div className="mt-4">
          <TimelineStep
            label="Order placed"
            description={`Your order has been sent to ${isMarket ? "the seller" : "the cook"}`}
            time={o.created_at}
            done
          />
          <TimelineStep
            label="Confirmed"
            description={o.status === "pending" ? `Waiting for ${isMarket ? "seller" : "cook"} to accept` : `${isMarket ? "Seller" : "Cook"} has accepted your order`}
            time={o.confirmed_at}
            done={["confirmed", "ready", "completed"].includes(o.status)}
            active={o.status === "pending"}
          />
          <TimelineStep
            label="Ready"
            description={o.type === "pickup" ? "Ready for pickup" : "Ready for delivery"}
            time={o.ready_at}
            done={["ready", "completed"].includes(o.status)}
            active={o.status === "confirmed"}
          />
          <TimelineStep
            label="Completed"
            description={o.type === "pickup" ? "Collected" : "Delivered"}
            time={o.completed_at}
            done={o.status === "completed"}
            active={o.status === "ready"}
            last
          />
          {order.status === "cancelled" && (
            <TimelineStep
              label="Cancelled"
              description="This order was cancelled"
              time={o.cancelled_at}
              done
              last
              cancelled
            />
          )}
        </div>
      </Card>

      {/* Delivery address */}
      {o.delivery_address && (
        <Card>
          <h2 className="text-sm font-bold text-stone-900">Delivery address</h2>
          <p className="mt-2 text-sm text-stone-700 whitespace-pre-wrap">{o.delivery_address}</p>
        </Card>
      )}

      {/* Provider info */}
      <Card>
        <h2 className="text-sm font-bold text-stone-900">{isMarket ? "Seller" : "Cook"}</h2>
        <Link
          href={providerLink}
          className="mt-3 flex items-center gap-3 transition hover:opacity-90"
        >
          {providerPhoto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={providerPhoto} alt="" className="h-12 w-12 rounded-full object-cover ring-2 ring-violet-100" />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-violet-100 to-violet-200 text-sm font-bold text-violet-600">
              {(providerName ?? "?")[0]?.toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-sm font-semibold text-stone-900">{providerName}</p>
            <p className="text-xs text-stone-500">
              {providerLocation ?? "—"}
              {o.status !== "pending" && o.status !== "cancelled" && providerPhone && (
                <> · {providerPhone}</>
              )}
            </p>
          </div>
        </Link>
      </Card>

      {/* Payment */}
      <Card>
        <h2 className="text-sm font-bold text-stone-900">Payment</h2>
        <div className="mt-3 space-y-1.5 text-sm">
          <Row label="Total paid" value={formatPrice(o.total_cents)} bold />
          <p className="text-[11px] text-stone-400">
            Platform fee {formatPrice(o.commission_cents)}, {isMarket ? "seller" : "cook"} receives{" "}
            {formatPrice(o.cook_payout_cents)}.
          </p>
        </div>
      </Card>

      {/* Actions */}
      {o.status === "pending" && (
        <CancelOrderButton orderId={o.id} />
      )}

      {o.status === "completed" && (
        <>
          <ReviewForm orderId={o.id} existing={existingReview} />
          {itemId && (
            <LinkButton
              href={isMarket ? `/customer/market/order/${itemId}` : `/customer/order/${itemId}`}
              variant="secondary"
              size="md"
              fullWidth
            >
              Order again
            </LinkButton>
          )}
        </>
      )}
    </div>
  );
}

/* ── Timeline step ──────────────────────────────────────────── */

function TimelineStep({
  label,
  description,
  time,
  done,
  active,
  last,
  cancelled,
}: {
  label: string;
  description: string;
  time?: string | null;
  done: boolean;
  active?: boolean;
  last?: boolean;
  cancelled?: boolean;
}) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div
          className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
            cancelled
              ? "bg-red-100 text-red-600"
              : done
              ? "bg-emerald-100 text-emerald-600"
              : active
              ? "bg-violet-100 text-violet-600"
              : "bg-stone-100 text-stone-400"
          }`}
        >
          {cancelled ? "✕" : done ? "✓" : active ? "•" : "·"}
        </div>
        {!last && (
          <div
            className={`w-0.5 flex-1 ${
              done ? "bg-emerald-200" : "bg-stone-200"
            }`}
          />
        )}
      </div>
      <div className={`pb-5 ${last ? "pb-0" : ""}`}>
        <p className={`text-sm font-semibold ${cancelled ? "text-red-700" : done ? "text-stone-900" : "text-stone-400"}`}>
          {label}
        </p>
        <p className="text-xs text-stone-500">{description}</p>
        {time && (
          <p className="mt-0.5 text-[10px] text-stone-400">
            {new Date(time).toLocaleString("en-US", {
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          </p>
        )}
      </div>
    </div>
  );
}

/* ── Helpers ────────────────────────────────────────────────── */

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? "font-semibold text-stone-900" : "text-stone-700"}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function statusTone(status: string): "neutral" | "amber" | "blue" | "green" | "red" {
  switch (status) {
    case "pending":
      return "amber";
    case "confirmed":
    case "ready":
      return "blue";
    case "completed":
      return "green";
    case "cancelled":
      return "red";
    default:
      return "neutral";
  }
}
