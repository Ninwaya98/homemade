import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { Card, EmptyState } from "@/components/ui/Card";
import { dayLabel, formatPrice } from "@/lib/constants";

export const metadata = { title: "Earnings — HomeMade" };

export default async function EarningsPage() {
  const profile = await requireRole("cook");
  const supabase = await createClient();

  const { data: cp } = await supabase
    .from("cook_profiles")
    .select("status")
    .eq("id", profile.id)
    .single();
  if (!cp || cp.status !== "approved") redirect("/cook");

  // Pull all completed orders + recent orders for the activity list.
  const { data: completed } = await supabase
    .from("orders")
    .select("cook_payout_cents, total_cents, created_at")
    .eq("cook_id", profile.id)
    .eq("status", "completed");

  const { data: recent } = await supabase
    .from("orders")
    .select("id, status, quantity, total_cents, cook_payout_cents, scheduled_for, created_at, dishes(name)")
    .eq("cook_id", profile.id)
    .neq("status", "cancelled")
    .order("created_at", { ascending: false })
    .limit(15);

  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  let allTime = 0;
  let thisWeek = 0;
  let thisMonth = 0;
  for (const o of completed ?? []) {
    allTime += o.cook_payout_cents;
    const d = new Date(o.created_at);
    if (d >= startOfWeek) thisWeek += o.cook_payout_cents;
    if (d >= startOfMonth) thisMonth += o.cook_payout_cents;
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-stone-900">Earnings</h1>
        <p className="mt-1 text-sm text-stone-600">
          What you&apos;ve made from completed orders. Payouts after the
          platform fee.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="This week" value={formatPrice(thisWeek)} />
        <StatCard label="This month" value={formatPrice(thisMonth)} />
        <StatCard label="All time" value={formatPrice(allTime)} />
      </div>

      <section>
        <h2 className="mb-3 text-base font-semibold text-stone-900">Recent activity</h2>
        {recent && recent.length > 0 ? (
          <Card className="p-0">
            <ul className="divide-y divide-stone-100">
              {recent.map((o) => (
                <li key={o.id} className="flex items-center justify-between px-5 py-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-stone-900">
                      {o.quantity}× {(o.dishes as { name?: string } | null)?.name ?? "—"}
                    </p>
                    <p className="text-xs text-stone-500">
                      {o.scheduled_for ? dayLabel(o.scheduled_for) : "—"} · {o.status}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-stone-900">
                      {formatPrice(o.cook_payout_cents)}
                    </p>
                    <p className="text-[10px] text-stone-400">
                      total {formatPrice(o.total_cents)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        ) : (
          <EmptyState title="No earnings yet" body="Once orders complete, payouts show up here." />
        )}
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <p className="text-xs uppercase tracking-wide text-stone-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-stone-900">{value}</p>
    </Card>
  );
}
