import Link from "next/link";
import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  allergenLabel,
  dayLabel,
  formatPrice,
} from "@/lib/constants";
import { OrderActions } from "./order-actions";

export const metadata = { title: "Order — Authentic Kitchen" };

export default async function CookOrderDetail({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const profile = await requireRole("cook");
  const { orderId } = await params;
  const supabase = await createClient();

  const { data: order } = await supabase
    .from("orders")
    .select(
      `
      *,
      dishes(name, description, allergens, photo_url),
      profiles!orders_customer_id_fkey(full_name, phone, location)
      `,
    )
    .eq("id", orderId)
    .eq("cook_id", profile.id)
    .maybeSingle();

  if (!order) notFound();

  const dish = order.dishes as { name?: string; description?: string | null; allergens?: string[]; photo_url?: string | null } | null;
  const customer = order.profiles as { full_name?: string; phone?: string | null; location?: string | null } | null;

  return (
    <div className="space-y-6">
      <Link href="/cook/orders" className="text-sm text-stone-500 hover:text-stone-800">
        ← All orders
      </Link>

      <Card>
        <div className="flex items-start gap-4">
          {dish?.photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={dish.photo_url} alt="" className="h-20 w-20 flex-none rounded-lg object-cover" />
          ) : (
            <div className="h-20 w-20 flex-none rounded-lg bg-stone-100" />
          )}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-stone-900">
                {order.quantity}× {dish?.name ?? "—"}
              </h1>
              <Badge tone={statusTone(order.status)}>{order.status}</Badge>
            </div>
            <p className="text-sm text-stone-500">
              for {order.scheduled_for ? dayLabel(order.scheduled_for) : "—"} · {order.type}
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
        <h2 className="text-sm font-semibold text-stone-900">Customer</h2>
        <p className="mt-2 text-sm text-stone-700">{customer?.full_name ?? "—"}</p>
        {customer?.phone && (
          <p className="text-sm text-stone-500">📞 {customer.phone}</p>
        )}
        {customer?.location && (
          <p className="text-sm text-stone-500">📍 {customer.location}</p>
        )}
      </Card>

      {order.notes && (
        <Card>
          <h2 className="text-sm font-semibold text-stone-900">Customer notes</h2>
          <p className="mt-2 text-sm text-stone-700 whitespace-pre-wrap">{order.notes}</p>
        </Card>
      )}

      <Card>
        <h2 className="text-sm font-semibold text-stone-900">Payment</h2>
        <div className="mt-3 space-y-1.5 text-sm">
          <Row label="Total" value={formatPrice(order.total_cents)} />
          <Row label="Platform fee" value={`− ${formatPrice(order.commission_cents)}`} />
          <hr className="my-2 border-stone-100" />
          <Row label="Your payout" value={formatPrice(order.cook_payout_cents)} bold />
        </div>
      </Card>

      <OrderActions orderId={order.id} status={order.status} />
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
