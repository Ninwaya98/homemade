import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { Card, EmptyState } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { dayLabel, formatPrice } from "@/lib/constants";

export const metadata = {
  title: "Orders — HomeMade",
};

export default async function CookOrdersPage() {
  const profile = await requireRole("cook");
  const supabase = await createClient();

  const { data: orders } = await supabase
    .from("orders")
    .select(
      `
      id, status, quantity, total_cents, cook_payout_cents, type, scheduled_for, notes, created_at,
      dishes(name),
      profiles!orders_customer_id_fkey(full_name, phone)
      `,
    )
    .eq("cook_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(100);

  // Group by status bucket for display
  const buckets: Record<string, typeof orders> = {
    new: [],
    in_progress: [],
    done: [],
  };
  for (const o of orders ?? []) {
    if (o.status === "pending") buckets.new!.push(o);
    else if (o.status === "confirmed" || o.status === "ready") buckets.in_progress!.push(o);
    else buckets.done!.push(o);
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold text-stone-900">Orders</h1>
      </header>

      <Section
        title="New — needs your attention"
        orders={buckets.new ?? []}
        emptyText="No new orders."
      />
      <Section
        title="In progress"
        orders={buckets.in_progress ?? []}
        emptyText="Nothing in flight."
      />
      <Section
        title="Done"
        orders={buckets.done ?? []}
        emptyText="No completed or cancelled orders yet."
      />
    </div>
  );
}

function Section({
  title,
  orders,
  emptyText,
}: {
  title: string;
  orders: any[];
  emptyText: string;
}) {
  return (
    <section>
      <h2 className="mb-3 text-base font-semibold text-stone-900">{title}</h2>
      {orders.length === 0 ? (
        <EmptyState title={emptyText} />
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <Link
              key={o.id}
              href={`/cook/orders/${o.id}`}
              className="block"
            >
              <Card className="hover:border-violet-300">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-stone-900">
                        {o.quantity}× {o.dishes?.name ?? "—"}
                      </p>
                      <Badge tone={statusTone(o.status)}>{o.status}</Badge>
                    </div>
                    <p className="text-xs text-stone-500">
                      {o.profiles?.full_name ?? "Customer"} ·{" "}
                      {o.scheduled_for ? dayLabel(o.scheduled_for) : "—"} · {o.type}
                    </p>
                    {o.notes && (
                      <p className="mt-2 line-clamp-1 text-xs text-stone-600">
                        “{o.notes}”
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-stone-900">
                      {formatPrice(o.cook_payout_cents)}
                    </p>
                    <p className="text-[10px] text-stone-400">your payout</p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

function statusTone(status: string): "neutral" | "amber" | "blue" | "green" | "red" {
  switch (status) {
    case "pending":
      return "amber";
    case "confirmed":
      return "blue";
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
