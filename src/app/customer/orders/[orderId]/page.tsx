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

export const metadata = { title: "Order — Authentic Kitchen" };

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

  const { data: order } = await supabase
    .from("orders")
    .select(
      `
      *,
      dishes(id, name, description, allergens, photo_url),
      cook_profiles!orders_cook_id_fkey(id, photo_url, profiles!cook_profiles_id_fkey!inner(full_name, phone, location))
      `,
    )
    .eq("id", orderId)
    .eq("customer_id", profile.id)
    .maybeSingle();

  if (!order) notFound();

  // Cast to include columns from migration 006 (not yet in generated types)
  const o = order as typeof order & {
    delivery_address?: string | null;
    confirmed_at?: string | null;
    ready_at?: string | null;
    completed_at?: string | null;
    cancelled_at?: string | null;
    estimated_ready_time?: string | null;
  };

  const dish = order.dishes as { id?: string; name?: string; description?: string | null; allergens?: string[]; photo_url?: string | null } | null;
  const cook = order.cook_profiles as {
    id: string;
    photo_url: string | null;
    profiles: { full_name?: string; phone?: string | null; location?: string | null };
  };

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
            We&apos;ve let {cook.profiles.full_name} know. They&apos;ll confirm it shortly.
          </p>

          <div className="mx-auto mt-6 max-w-xs rounded-xl border border-stone-200 bg-white p-4 text-left shadow-sm">
            <div className="flex items-center gap-3">
              {dish?.photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={dish.photo_url} alt="" className="h-14 w-14 rounded-lg object-cover" />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-stone-100 text-xl">🍽</div>
              )}
              <div>
                <p className="text-sm font-semibold text-stone-900">
                  {order.quantity}× {dish?.name ?? "—"}
                </p>
                <p className="text-xs text-stone-500">
                  {order.scheduled_for ? dayLabel(order.scheduled_for) : "—"} · {order.type}
                </p>
                <p className="text-sm font-medium text-amber-700">{formatPrice(order.total_cents)}</p>
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
      <Link href="/customer/orders" className="text-sm text-stone-400 transition hover:text-amber-700">
        &larr; All orders
      </Link>

      {/* Order header */}
      <Card>
        <div className="flex items-start gap-4">
          {dish?.photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={dish.photo_url} alt="" className="h-20 w-20 flex-none rounded-xl object-cover shadow-sm" />
          ) : (
            <div className="flex h-20 w-20 flex-none items-center justify-center rounded-xl bg-stone-100 text-2xl">🍽</div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-stone-900">
                {order.quantity}× {dish?.name ?? "—"}
              </h1>
              <Badge tone={statusTone(order.status)}>{order.status}</Badge>
            </div>
            <p className="text-sm text-stone-500">
              {order.scheduled_for ? dayLabel(order.scheduled_for) : "—"} · {order.type}
            </p>
            {o.estimated_ready_time && (
              <p className="mt-1 text-sm font-medium text-amber-700">
                Estimated ready: {o.estimated_ready_time}
              </p>
            )}
            {dish?.allergens && dish.allergens.length > 0 && (
              <p className="mt-2 rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs font-medium text-amber-900">
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
            description="Your order has been sent to the cook"
            time={order.created_at}
            done
          />
          <TimelineStep
            label="Confirmed"
            description={order.status === "pending" ? "Waiting for cook to accept" : "Cook has accepted your order"}
            time={o.confirmed_at}
            done={["confirmed", "ready", "completed"].includes(order.status)}
            active={order.status === "pending"}
          />
          <TimelineStep
            label="Ready"
            description={order.type === "pickup" ? "Ready for pickup" : "Ready for delivery"}
            time={o.ready_at}
            done={["ready", "completed"].includes(order.status)}
            active={order.status === "confirmed"}
          />
          <TimelineStep
            label="Completed"
            description={order.type === "pickup" ? "Collected" : "Delivered"}
            time={o.completed_at}
            done={order.status === "completed"}
            active={order.status === "ready"}
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

      {/* Cook info */}
      <Card>
        <h2 className="text-sm font-bold text-stone-900">Cook</h2>
        <Link
          href={`/customer/cooks/${cook.id}`}
          className="mt-3 flex items-center gap-3 transition hover:opacity-90"
        >
          {cook.photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cook.photo_url} alt="" className="h-12 w-12 rounded-full object-cover ring-2 ring-amber-100" />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-amber-200 text-sm font-bold text-amber-700">
              {cook.profiles.full_name?.[0]?.toUpperCase() ?? "?"}
            </div>
          )}
          <div>
            <p className="text-sm font-semibold text-stone-900">
              {cook.profiles.full_name}
            </p>
            <p className="text-xs text-stone-500">
              {cook.profiles.location ?? "—"}
              {order.status !== "pending" && order.status !== "cancelled" && cook.profiles.phone && (
                <> · {cook.profiles.phone}</>
              )}
            </p>
          </div>
        </Link>
      </Card>

      {/* Payment */}
      <Card>
        <h2 className="text-sm font-bold text-stone-900">Payment</h2>
        <div className="mt-3 space-y-1.5 text-sm">
          <Row label="Total paid" value={formatPrice(order.total_cents)} bold />
          <p className="text-[11px] text-stone-400">
            Platform fee {formatPrice(order.commission_cents)}, cook receives{" "}
            {formatPrice(order.cook_payout_cents)}.
          </p>
        </div>
      </Card>

      {/* Actions */}
      {order.status === "pending" && (
        <CancelOrderButton orderId={order.id} />
      )}

      {order.status === "completed" && (
        <>
          <ReviewForm orderId={order.id} existing={existingReview} />
          {dish?.id && (
            <LinkButton
              href={`/customer/order/${dish.id}`}
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
              ? "bg-amber-100 text-amber-700"
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
