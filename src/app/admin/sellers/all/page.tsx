import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { Card, EmptyState } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { productCategoryLabel } from "@/lib/constants";

export const metadata = {
  title: "All sellers — HomeMade Admin",
};

export default async function AllSellersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireRole("admin");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any;
  const sp = await searchParams;

  let query = supabase
    .from("seller_health")
    .select("*");

  if (sp.status) {
    query = query.eq("health_status", sp.status);
  }

  const { data: sellers } = await query;

  const statuses = ["active", "new", "low_orders", "no_products", "inactive", "pending", "suspended"];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-stone-900">All sellers</h1>

      <div className="flex flex-wrap gap-1.5">
        <FilterPill href="/admin/sellers/all" active={!sp.status}>All</FilterPill>
        {statuses.map((s) => (
          <FilterPill key={s} href={`/admin/sellers/all?status=${s}`} active={sp.status === s}>
            {s.replace("_", " ")}
          </FilterPill>
        ))}
      </div>

      {sellers && sellers.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-200 text-left text-xs font-semibold uppercase tracking-wider text-stone-500">
                <th className="px-3 py-2">Seller</th>
                <th className="px-3 py-2">Category</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Rating</th>
                <th className="px-3 py-2">Products</th>
                <th className="px-3 py-2">7d orders</th>
                <th className="px-3 py-2">Last order</th>
              </tr>
            </thead>
            <tbody>
              {sellers.map((s: {
                id: string; full_name: string; shop_name: string; category: string;
                health_status: string; avg_rating: number; rating_count: number;
                active_products: number; orders_last_7d: number; last_order_at: string | null;
              }) => (
                <tr key={s.id} className="border-b border-stone-100 hover:bg-stone-50">
                  <td className="px-3 py-3">
                    <Link
                      href={`/admin/sellers/${s.id}`}
                      className="font-medium text-stone-900 hover:text-violet-700 hover:underline"
                    >
                      {s.shop_name}
                    </Link>
                    <p className="text-xs text-stone-500">{s.full_name}</p>
                  </td>
                  <td className="px-3 py-3">
                    <Badge tone="neutral">{productCategoryLabel(s.category)}</Badge>
                  </td>
                  <td className="px-3 py-3">
                    <Badge tone={healthTone(s.health_status)}>{s.health_status.replace("_", " ")}</Badge>
                  </td>
                  <td className="px-3 py-3">
                    {s.rating_count > 0
                      ? `★ ${Number(s.avg_rating).toFixed(1)} (${s.rating_count})`
                      : "—"}
                  </td>
                  <td className="px-3 py-3">{s.active_products}</td>
                  <td className="px-3 py-3">{s.orders_last_7d}</td>
                  <td className="px-3 py-3 text-xs text-stone-500">
                    {s.last_order_at
                      ? new Date(s.last_order_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState title="No sellers found" />
      )}
    </div>
  );
}

function healthTone(status: string): "neutral" | "amber" | "green" | "red" | "blue" {
  switch (status) {
    case "active": return "green";
    case "new": return "blue";
    case "low_orders": case "no_products": return "amber";
    case "inactive": case "suspended": return "red";
    default: return "neutral";
  }
}

function FilterPill({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`rounded-full border px-3 py-1.5 text-xs font-medium capitalize transition ${
        active
          ? "border-violet-600 bg-violet-600 text-white"
          : "border-stone-200 bg-white text-stone-600 hover:border-violet-300"
      }`}
    >
      {children}
    </Link>
  );
}
