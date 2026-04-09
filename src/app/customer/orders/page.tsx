import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { Card, EmptyState } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { dayLabel, formatPrice } from "@/lib/constants";

export const metadata = { title: "My orders — Authentic Kitchen" };

export default async function CustomerOrdersPage() {
  const profile = await requireRole("customer");
  const supabase = await createClient();

  const { data: orders } = await supabase
    .from("orders")
    .select(
      `
      id, status, quantity, total_cents, type, scheduled_for, created_at,
      dishes(name, photo_url),
      cook_profiles!orders_cook_id_fkey(profiles!cook_profiles_id_fkey!inner(full_name))
      `,
    )
    .eq("customer_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-stone-900">My orders</h1>
      </header>

      {orders && orders.length > 0 ? (
        <div className="space-y-3">
          {orders.map((o) => {
            const dish = o.dishes as { name?: string; photo_url?: string | null } | null;
            const cookName =
              ((o.cook_profiles as { profiles?: { full_name?: string } } | null)?.profiles?.full_name) ??
              "—";
            return (
              <Link key={o.id} href={`/customer/orders/${o.id}`} className="block">
                <Card className="hover:border-amber-300">
                  <div className="flex items-center gap-4">
                    {dish?.photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={dish.photo_url}
                        alt=""
                        className="h-16 w-16 flex-none rounded-lg object-cover"
                      />
                    ) : (
                      <div className="h-16 w-16 flex-none rounded-lg bg-stone-100" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-stone-900">
                          {o.quantity}× {dish?.name ?? "—"}
                        </p>
                        <Badge tone={statusTone(o.status)}>{o.status}</Badge>
                      </div>
                      <p className="text-xs text-stone-500">
                        from {cookName} · {o.scheduled_for ? dayLabel(o.scheduled_for) : "—"} · {o.type}
                      </p>
                    </div>
                    <p className="text-sm font-medium text-stone-900">
                      {formatPrice(o.total_cents)}
                    </p>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="No orders yet"
          body="Browse the feed and order your first homemade meal."
        />
      )}
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
