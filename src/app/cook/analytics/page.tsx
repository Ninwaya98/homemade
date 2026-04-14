import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { requireCookProfile } from "@/lib/auth";
import { Card, EmptyState } from "@/components/ui/Card";
import { RatingBar } from "@/components/ui/RatingBar";
import { formatPrice } from "@/lib/constants";

export const metadata = { title: "Analytics — HomeMade Kitchen" };

export default async function AnalyticsPage() {
  const { profile, cookProfile } = await requireCookProfile();
  const supabase = await createClient();

  // Guard: only approved cooks
  if (cookProfile.status !== "approved") redirect("/cook");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;

  // ── Date boundaries ──────────────────────────────────────────────
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Monday-based week start
  const dayOfWeek = now.getDay(); // 0=Sun
  const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - mondayOffset);

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // ── Revenue: all completed orders ────────────────────────────────
  const { data: completedOrders } = await sb
    .from("orders")
    .select("cook_payout_cents, created_at, dish_id, quantity, total_cents")
    .eq("cook_id", profile.id)
    .eq("status", "completed");

  let revenueToday = 0;
  let revenueWeek = 0;
  let revenueMonth = 0;
  let revenueAllTime = 0;

  const dishOrderMap: Record<string, { count: number; revenue: number }> = {};

  for (const o of completedOrders ?? []) {
    const payout = o.cook_payout_cents ?? 0;
    revenueAllTime += payout;

    const d = new Date(o.created_at);
    if (d >= todayStart) revenueToday += payout;
    if (d >= weekStart) revenueWeek += payout;
    if (d >= monthStart) revenueMonth += payout;

    // Accumulate per-dish stats
    if (o.dish_id) {
      if (!dishOrderMap[o.dish_id]) {
        dishOrderMap[o.dish_id] = { count: 0, revenue: 0 };
      }
      dishOrderMap[o.dish_id].count += o.quantity ?? 1;
      dishOrderMap[o.dish_id].revenue += payout;
    }
  }

  // ── Order stats ──────────────────────────────────────────────────
  const { count: totalOrders } = await sb
    .from("orders")
    .select("*", { count: "exact", head: true })
    .eq("cook_id", profile.id);

  const { count: completedCount } = await sb
    .from("orders")
    .select("*", { count: "exact", head: true })
    .eq("cook_id", profile.id)
    .eq("status", "completed");

  const { count: cancelledCount } = await sb
    .from("orders")
    .select("*", { count: "exact", head: true })
    .eq("cook_id", profile.id)
    .eq("status", "cancelled");

  const completionRate =
    totalOrders && totalOrders > 0
      ? Math.round(((completedCount ?? 0) / totalOrders) * 100)
      : 0;

  // ── Top 5 dishes ─────────────────────────────────────────────────
  const topDishIds = Object.entries(dishOrderMap)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5);

  // Fetch dish names for top dishes
  let dishNames: Record<string, string> = {};
  if (topDishIds.length > 0) {
    const ids = topDishIds.map(([id]) => id);
    const { data: dishes } = await sb
      .from("dishes")
      .select("id, name")
      .in("id", ids);

    if (dishes) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      dishNames = Object.fromEntries(dishes.map((d: any) => [d.id, d.name]));
    }
  }

  const topDishes = topDishIds.map(([id, stats]) => ({
    id,
    name: dishNames[id] ?? "Unknown dish",
    orderCount: stats.count,
    revenue: stats.revenue,
  }));

  const maxDishOrders = topDishes.length > 0 ? topDishes[0].orderCount : 1;

  // ── Rating summary ──────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cook = cookProfile as any;
  const likeCount: number = cook.like_count ?? 0;
  const dislikeCount: number = cook.dislike_count ?? 0;
  const resolvedCount: number = cook.resolved_count ?? 0;
  const ratingScore: number | null = cook.score ?? null;
  const reviewTotal = likeCount + dislikeCount;

  // ── Recent 10 completed orders ──────────────────────────────────
  const { data: recentOrders } = await sb
    .from("orders")
    .select("id, quantity, cook_payout_cents, created_at, dishes(name)")
    .eq("cook_id", profile.id)
    .eq("status", "completed")
    .order("created_at", { ascending: false })
    .limit(10);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <header>
        <h1 className="text-2xl font-semibold text-stone-900">Analytics</h1>
        <p className="mt-1 text-sm text-stone-500">
          Track your kitchen performance
        </p>
      </header>

      {/* Revenue cards */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-stone-400">
          Revenue
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <RevenueCard label="Today" value={revenueToday} accent />
          <RevenueCard label="This Week" value={revenueWeek} />
          <RevenueCard label="This Month" value={revenueMonth} />
          <RevenueCard label="All Time" value={revenueAllTime} />
        </div>
      </section>

      {/* Order stats */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-stone-400">
          Orders
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Total Orders" value={String(totalOrders ?? 0)} />
          <StatCard
            label="Completed"
            value={String(completedCount ?? 0)}
            tone="green"
          />
          <StatCard
            label="Cancelled"
            value={String(cancelledCount ?? 0)}
            tone="red"
          />
          <StatCard
            label="Completion Rate"
            value={`${completionRate}%`}
            tone={completionRate >= 80 ? "green" : completionRate >= 50 ? "amber" : "red"}
          />
        </div>
      </section>

      {/* Top dishes */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-stone-400">
          Top Dishes
        </h2>
        {topDishes.length > 0 ? (
          <Card>
            <ol className="space-y-4">
              {topDishes.map((dish, i) => (
                <li key={dish.id} className="flex items-center gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-700">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="truncate text-sm font-medium text-stone-900">
                        {dish.name}
                      </p>
                      <div className="ml-3 shrink-0 text-right">
                        <span className="text-sm font-semibold text-stone-900">
                          {formatPrice(dish.revenue)}
                        </span>
                        <span className="ml-2 text-xs text-stone-500">
                          {dish.orderCount} order{dish.orderCount !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                    {/* CSS bar */}
                    <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-violet-100/60">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-violet-500 to-violet-400 transition-all duration-500"
                        style={{
                          width: `${Math.round(
                            (dish.orderCount / maxDishOrders) * 100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </Card>
        ) : (
          <EmptyState
            title="No completed orders yet"
            body="Once you complete orders, your top dishes will appear here."
          />
        )}
      </section>

      {/* Ratings */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-stone-400">
          Ratings
        </h2>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-stone-700">Your score</p>
              <div className="mt-1">
                <RatingBar score={ratingScore} reviewCount={reviewTotal} size="md" />
              </div>
            </div>
            <div className="flex gap-5 text-center">
              <div>
                <p className="text-lg font-bold text-emerald-600">{likeCount}</p>
                <p className="text-[10px] text-stone-500">Likes</p>
              </div>
              <div>
                <p className="text-lg font-bold text-rose-500">{dislikeCount}</p>
                <p className="text-[10px] text-stone-500">Dislikes</p>
              </div>
              <div>
                <p className="text-lg font-bold text-sky-600">{resolvedCount}</p>
                <p className="text-[10px] text-stone-500">Resolved</p>
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* Recent activity */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-stone-400">
          Recent Activity
        </h2>
        {recentOrders && recentOrders.length > 0 ? (
          <Card className="p-0">
            {/* Table header */}
            <div className="hidden border-b border-stone-100 px-5 py-3 sm:grid sm:grid-cols-4 sm:gap-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">
                Date
              </p>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">
                Dish
              </p>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-400 text-right">
                Qty
              </p>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-400 text-right">
                Revenue
              </p>
            </div>
            <ul className="divide-y divide-stone-100">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {recentOrders.map((o: any) => (
                <li
                  key={o.id}
                  className="px-5 py-3.5 sm:grid sm:grid-cols-4 sm:items-center sm:gap-4"
                >
                  <p className="text-xs text-stone-500">
                    {new Date(o.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                  <p className="mt-0.5 text-sm font-medium text-stone-900 sm:mt-0">
                    {(o.dishes as { name?: string } | null)?.name ?? "—"}
                  </p>
                  <p className="text-sm text-stone-600 sm:text-right">
                    {o.quantity}
                  </p>
                  <p className="text-sm font-semibold text-stone-900 sm:text-right">
                    {formatPrice(o.cook_payout_cents)}
                  </p>
                </li>
              ))}
            </ul>
          </Card>
        ) : (
          <EmptyState
            title="No activity yet"
            body="Completed orders will show up here."
          />
        )}
      </section>
    </div>
  );
}

function RevenueCard({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <Card className={accent ? "border-violet-200 bg-violet-50/40" : ""}>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">
        {label}
      </p>
      <p
        className={`mt-2 text-xl font-bold ${
          accent ? "text-violet-700" : "text-stone-900"
        }`}
      >
        {formatPrice(value)}
      </p>
    </Card>
  );
}

function StatCard({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "green" | "red" | "amber";
}) {
  const valueColor: Record<string, string> = {
    neutral: "text-stone-900",
    green: "text-emerald-700",
    red: "text-rose-600",
    amber: "text-amber-700",
  };

  return (
    <Card>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">
        {label}
      </p>
      <p className={`mt-2 text-xl font-bold ${valueColor[tone]}`}>{value}</p>
    </Card>
  );
}
