import Link from "next/link";
import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatPrice } from "@/lib/constants";
import { SellerOrderActions } from "./order-actions";

export const metadata = { title: "Order — HomeMade Market" };

export default async function SellerOrderDetail({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const profile = await requireRole("seller");
  const { orderId } = await params;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any;

  const { data: order } = await supabase
    .from("orders")
    .select(`
      *,
      products(name, description, photo_urls),
      profiles!orders_customer_id_fkey(full_name, phone, location)
    `)
    .eq("id", orderId)
    .eq("seller_id", profile.id)
    .eq("vertical", "market")
    .maybeSingle();

  if (!order) notFound();

  const product = order.products as { name?: string; description?: string | null; photo_urls?: string[] } | null;
  const customer = order.profiles as { full_name?: string; phone?: string | null; location?: string | null } | null;

  return (
    <div className="space-y-6">
      <Link href="/seller/orders" className="text-sm text-stone-400 transition hover:text-amber-700">
        &larr; All orders
      </Link>

      <Card>
        <div className="flex items-start gap-4">
          {product?.photo_urls && product.photo_urls.length > 0 ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.photo_urls[0]} alt="" className="h-20 w-20 flex-none rounded-xl object-cover shadow-sm" />
          ) : (
            <div className="flex h-20 w-20 flex-none items-center justify-center rounded-xl bg-stone-100 text-2xl">🛍</div>
          )}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-stone-900">
                {order.quantity}× {product?.name ?? "—"}
              </h1>
              <Badge tone={statusTone(order.status)}>{order.status}</Badge>
            </div>
            <p className="text-sm text-stone-500">{order.type}</p>
            {order.estimated_ready_time && (
              <p className="mt-1 text-sm font-medium text-amber-700">
                Estimated ready: {order.estimated_ready_time}
              </p>
            )}
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-sm font-bold text-stone-900">Customer</h2>
        <div className="mt-2 space-y-1">
          <p className="text-sm font-medium text-stone-700">{customer?.full_name ?? "—"}</p>
          {customer?.phone && <p className="text-sm text-stone-500">{customer.phone}</p>}
          {customer?.location && <p className="text-sm text-stone-500">{customer.location}</p>}
        </div>
      </Card>

      {order.delivery_address && (
        <Card className="border-blue-200 bg-blue-50">
          <h2 className="text-sm font-bold text-blue-900">Delivery address</h2>
          <p className="mt-2 text-sm text-blue-800 whitespace-pre-wrap">{order.delivery_address}</p>
        </Card>
      )}

      {order.notes && (
        <Card>
          <h2 className="text-sm font-bold text-stone-900">Customer notes</h2>
          <p className="mt-2 text-sm text-stone-700 whitespace-pre-wrap">{order.notes}</p>
        </Card>
      )}

      <Card>
        <h2 className="text-sm font-bold text-stone-900">Timeline</h2>
        <div className="mt-3 space-y-2 text-sm">
          <TimeRow label="Ordered" time={order.created_at} />
          {order.confirmed_at && <TimeRow label="Confirmed" time={order.confirmed_at} />}
          {order.ready_at && <TimeRow label="Ready" time={order.ready_at} />}
          {order.completed_at && <TimeRow label="Completed" time={order.completed_at} />}
          {order.cancelled_at && <TimeRow label="Cancelled" time={order.cancelled_at} />}
        </div>
      </Card>

      <Card>
        <h2 className="text-sm font-bold text-stone-900">Payment</h2>
        <div className="mt-3 space-y-1.5 text-sm">
          <Row label="Total" value={formatPrice(order.total_cents)} />
          <Row label="Platform fee" value={`− ${formatPrice(order.commission_cents)}`} />
          <hr className="my-2 border-stone-100" />
          <Row label="Your payout" value={formatPrice(order.cook_payout_cents)} bold />
        </div>
      </Card>

      <SellerOrderActions orderId={order.id} status={order.status} />
    </div>
  );
}

function TimeRow({ label, time }: { label: string; time: string }) {
  return (
    <div className="flex justify-between text-stone-600">
      <span>{label}</span>
      <span className="text-stone-400">
        {new Date(time).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
      </span>
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
    case "pending": return "amber";
    case "confirmed": case "ready": return "blue";
    case "completed": return "green";
    case "cancelled": return "red";
    default: return "neutral";
  }
}
