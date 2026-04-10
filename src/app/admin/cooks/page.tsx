import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { Card, EmptyState } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export const metadata = { title: "All cooks — HomeMade Admin" };

export default async function AdminCooksPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireRole("admin");
  const supabase = await createClient();
  const sp = await searchParams;

  let query = supabase
    .from("cook_health")
    .select("*")
    .order("last_active_at", { ascending: false })
    .limit(100);

  if (sp.status) {
    query = query.eq("health_status", sp.status);
  }

  const { data: cooks } = await query;

  const buckets = [
    { id: "active",      label: "Active",       tone: "green"   as const },
    { id: "low_orders",  label: "Low orders",   tone: "amber"   as const },
    { id: "no_schedule", label: "No schedule",  tone: "amber"   as const },
    { id: "inactive",    label: "Inactive 14d", tone: "red"     as const },
    { id: "pending",     label: "Pending",      tone: "neutral" as const },
    { id: "suspended",   label: "Suspended",    tone: "red"     as const },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-stone-900">All cooks</h1>
        <p className="mt-1 text-stone-600">
          Health-check view. Inactive 14+ days are auto-flagged.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        <FilterPill href="/admin/cooks" active={!sp.status}>All</FilterPill>
        {buckets.map((b) => (
          <FilterPill
            key={b.id}
            href={`/admin/cooks?status=${b.id}`}
            active={sp.status === b.id}
          >
            {b.label}
          </FilterPill>
        ))}
      </div>

      {cooks && cooks.length > 0 ? (
        <Card className="p-0">
          <table className="w-full text-sm">
            <thead className="border-b border-stone-200 bg-stone-50 text-left text-xs uppercase tracking-wide text-stone-500">
              <tr>
                <th className="px-5 py-3">Cook</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Rating</th>
                <th className="px-5 py-3">Last order</th>
                <th className="px-5 py-3">Open days</th>
                <th className="px-5 py-3">7d orders</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {cooks.map((c) => (
                <tr key={c.id}>
                  <td className="px-5 py-3 font-medium text-stone-900">
                    {c.full_name}
                  </td>
                  <td className="px-5 py-3">
                    <Badge tone={healthTone(c.health_status)}>
                      {c.health_status?.replace("_", " ")}
                    </Badge>
                  </td>
                  <td className="px-5 py-3 text-stone-700">
                    {(c.rating_count ?? 0) > 0 ? `⭐ ${Number(c.avg_rating ?? 0).toFixed(1)} (${c.rating_count})` : "—"}
                  </td>
                  <td className="px-5 py-3 text-stone-600">
                    {c.last_order_at
                      ? new Date(c.last_order_at).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="px-5 py-3 text-stone-600">
                    {c.upcoming_open_days ?? 0}
                  </td>
                  <td className="px-5 py-3 text-stone-600">
                    {c.orders_last_7d ?? 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : (
        <EmptyState title="No cooks match this filter" />
      )}
    </div>
  );
}

function FilterPill({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full border px-3 py-1.5 text-sm transition ${
        active
          ? "border-stone-900 bg-stone-900 text-white"
          : "border-stone-300 bg-white text-stone-700 hover:border-stone-500"
      }`}
    >
      {children}
    </Link>
  );
}

function healthTone(status: string | null): "neutral" | "amber" | "green" | "red" {
  switch (status) {
    case "active":
      return "green";
    case "low_orders":
    case "no_schedule":
    case "pending":
      return "amber";
    case "inactive":
    case "suspended":
      return "red";
    default:
      return "neutral";
  }
}
