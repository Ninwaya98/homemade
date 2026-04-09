import Link from "next/link";
import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
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
      dishes(name, description, allergens, photo_url),
      cook_profiles!orders_cook_id_fkey(id, photo_url, profiles!cook_profiles_id_fkey!inner(full_name, phone, location))
      `,
    )
    .eq("id", orderId)
    .eq("customer_id", profile.id)
    .maybeSingle();

  if (!order) notFound();
  const dish = order.dishes as { name?: string; description?: string | null; allergens?: string[]; photo_url?: string | null } | null;
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

  return (
    <div className="space-y-6">
      <Link href="/customer/orders" className="text-sm text-stone-500 hover:text-stone-800">
        ← All orders
      </Link>

      {placed && (
        <Card className="border-emerald-200 bg-emerald-50">
          <p className="text-sm font-medium text-emerald-900">Order placed.</p>
          <p className="mt-1 text-xs text-emerald-900/80">
            We&apos;ve let {cook.profiles.full_name} know. You&apos;ll see the
            status update here as it changes.
          </p>
        </Card>
      )}

      <Card>
        <div className="flex items-start gap-4">
          {dish?.photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={dish.photo_url} alt="" className="h-20 w-20 flex-none rounded-lg object-cover" />
          ) : (
            <div className="h-20 w-20 flex-none rounded-lg bg-stone-100" />
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-stone-900">
                {order.quantity}× {dish?.name ?? "—"}
              </h1>
              <Badge tone={statusTone(order.status)}>{order.status}</Badge>
            </div>
            <p className="text-sm text-stone-500">
              {order.scheduled_for ? dayLabel(order.scheduled_for) : "—"} · {order.type}
            </p>
            {dish?.allergens && dish.allergens.length > 0 && (
              <p className="mt-2 rounded-md bg-amber-50 px-2 py-1 text-xs text-amber-900">
                Contains: {dish.allergens.map(allergenLabel).join(", ")}
              </p>
            )}
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-sm font-semibold text-stone-900">Cook</h2>
        <Link
          href={`/customer/cooks/${cook.id}`}
          className="mt-3 flex items-center gap-3 hover:opacity-90"
        >
          {cook.photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cook.photo_url} alt="" className="h-12 w-12 rounded-full object-cover" />
          ) : (
            <div className="h-12 w-12 rounded-full bg-amber-100" />
          )}
          <div>
            <p className="text-sm font-medium text-stone-900">
              {cook.profiles.full_name}
            </p>
            <p className="text-xs text-stone-500">
              {cook.profiles.location ?? "—"}
              {order.status !== "pending" && order.status !== "cancelled" && cook.profiles.phone && (
                <> · 📞 {cook.profiles.phone}</>
              )}
            </p>
          </div>
        </Link>
      </Card>

      <Card>
        <h2 className="text-sm font-semibold text-stone-900">Payment</h2>
        <div className="mt-3 space-y-1.5 text-sm">
          <Row label="Total paid" value={formatPrice(order.total_cents)} bold />
          <p className="text-[11px] text-stone-400">
            Platform fee {formatPrice(order.commission_cents)}, cook receives{" "}
            {formatPrice(order.cook_payout_cents)}.
          </p>
        </div>
      </Card>

      {order.status === "pending" && (
        <CancelOrderButton orderId={order.id} />
      )}

      {order.status === "completed" && (
        <ReviewForm orderId={order.id} existing={existingReview} />
      )}
    </div>
  );
}

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
