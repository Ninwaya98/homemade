import { createClient } from "@/lib/supabase/server";
import { requireSellerProfile } from "@/lib/auth";
import { Card, EmptyState } from "@/components/ui/Card";
import { formatPrice } from "@/lib/constants";

export const metadata = {
  title: "Earnings — HomeMade Market",
};

export default async function SellerEarningsPage() {
  const { profile } = await requireSellerProfile();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any;

  const { data: completedOrders } = await supabase
    .from("orders")
    .select("id, cook_payout_cents, created_at, quantity, products(name)")
    .eq("seller_id", profile.id)
    .eq("vertical", "market")
    .eq("status", "completed")
    .order("created_at", { ascending: false })
    .limit(50);

  const orders = completedOrders ?? [];
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  let weekTotal = 0;
  let monthTotal = 0;
  let allTimeTotal = 0;

  for (const o of orders) {
    const payout = o.cook_payout_cents ?? 0;
    allTimeTotal += payout;
    const d = new Date(o.created_at);
    if (d >= startOfWeek) weekTotal += payout;
    if (d >= startOfMonth) monthTotal += payout;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-stone-900">Earnings</h1>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">This week</p>
          <p className="mt-1 text-2xl font-bold text-stone-900">{formatPrice(weekTotal)}</p>
        </Card>
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">This month</p>
          <p className="mt-1 text-2xl font-bold text-stone-900">{formatPrice(monthTotal)}</p>
        </Card>
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">All time</p>
          <p className="mt-1 text-2xl font-bold text-stone-900">{formatPrice(allTimeTotal)}</p>
        </Card>
      </div>

      <Card>
        <h2 className="text-lg font-semibold text-stone-900">Recent activity</h2>
        {orders.length > 0 ? (
          <ul className="mt-4 divide-y divide-stone-100">
            {orders.slice(0, 20).map((o: { id: string; created_at: string; cook_payout_cents: number; quantity: number; products: { name: string } | null }) => (
              <li key={o.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-stone-900">
                    {o.quantity}× {o.products?.name ?? "—"}
                  </p>
                  <p className="text-xs text-stone-500">
                    {new Date(o.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <p className="text-sm font-semibold text-emerald-700">
                  +{formatPrice(o.cook_payout_cents)}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-stone-500">
            No completed orders yet. Your earnings will appear here.
          </p>
        )}
      </Card>
    </div>
  );
}
