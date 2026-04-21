import Link from "next/link";

import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, EmptyState } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export const metadata = { title: "Audit log — HomeMade Admin" };

type AuditRow = {
  id: string;
  action: string;
  target_table: string;
  target_id: string | null;
  target_seller_id: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  notes: string | null;
  created_at: string;
  admin: { full_name?: string } | null;
  seller: { shop_name?: string } | null;
};

const ACTION_FILTERS: { id: string; label: string }[] = [
  { id: "all", label: "All" },
  { id: "seller", label: "Sellers" },
  { id: "product", label: "Products" },
  { id: "order", label: "Orders" },
  { id: "review", label: "Reviews" },
];

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  await requireRole("admin");
  const sp = await searchParams;
  const filter = sp.filter ?? "all";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any;

  let query = supabase
    .from("admin_audit_log")
    .select(
      "id, action, target_table, target_id, target_seller_id, old_values, new_values, notes, created_at, admin:profiles!admin_audit_log_admin_id_fkey(full_name), seller:seller_profiles!admin_audit_log_target_seller_id_fkey(shop_name)",
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (filter !== "all") {
    query = query.ilike("action", `${filter}.%`);
  }

  const { data: entries } = await query;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Audit log</h1>
        <p className="mt-1 text-sm text-stone-500">
          Who did what, and when. Append-only — entries cannot be edited
          or deleted.
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {ACTION_FILTERS.map((f) => (
          <FilterPill
            key={f.id}
            href={f.id === "all" ? "/admin/audit" : `/admin/audit?filter=${f.id}`}
            active={filter === f.id}
          >
            {f.label}
          </FilterPill>
        ))}
      </div>

      {entries && entries.length > 0 ? (
        <Card>
          <ul className="divide-y divide-stone-100">
            {(entries as AuditRow[]).map((e) => {
              const actionFamily = e.action.split(".")[0];
              const actionVerb = e.action.split(".")[1] ?? e.action;
              return (
                <li key={e.id} className="py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={actionTone(actionFamily)}>{actionFamily}</Badge>
                    <span className="text-sm font-semibold text-stone-900">
                      {actionVerb.replace(/_/g, " ")}
                    </span>
                    <span className="text-xs text-stone-500">
                      by <span className="font-medium">{e.admin?.full_name ?? "Unknown admin"}</span>
                    </span>
                    <span className="ml-auto text-[11px] text-stone-400">
                      {new Date(e.created_at).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-stone-500">
                    Target: <span className="font-medium">{e.target_table}</span>
                    {e.target_id ? ` · ${e.target_id.slice(0, 8)}…` : ""}
                    {e.seller?.shop_name ? ` · shop: ${e.seller.shop_name}` : ""}
                    {e.target_seller_id && !e.seller?.shop_name
                      ? ` · seller: ${e.target_seller_id.slice(0, 8)}…`
                      : ""}
                    {e.target_seller_id && (
                      <>
                        {" "}
                        ·{" "}
                        <Link
                          href={`/admin/sellers/${e.target_seller_id}`}
                          className="text-violet-600 hover:underline"
                        >
                          view shop
                        </Link>
                      </>
                    )}
                  </p>
                  {e.notes && (
                    <p className="mt-1 text-xs italic text-amber-700">
                      Note: {e.notes}
                    </p>
                  )}
                  {(e.old_values || e.new_values) && (
                    <details className="mt-1.5">
                      <summary className="cursor-pointer text-[11px] text-stone-400 hover:text-violet-600">
                        Show values
                      </summary>
                      <div className="mt-1.5 grid gap-2 sm:grid-cols-2">
                        {e.old_values && (
                          <pre className="overflow-x-auto rounded-lg bg-stone-50 p-2 text-[10px] text-stone-700">
                            <span className="font-semibold text-stone-500">before</span>
                            {"\n"}
                            {JSON.stringify(e.old_values, null, 2)}
                          </pre>
                        )}
                        {e.new_values && (
                          <pre className="overflow-x-auto rounded-lg bg-stone-50 p-2 text-[10px] text-stone-700">
                            <span className="font-semibold text-stone-500">after</span>
                            {"\n"}
                            {JSON.stringify(e.new_values, null, 2)}
                          </pre>
                        )}
                      </div>
                    </details>
                  )}
                </li>
              );
            })}
          </ul>
        </Card>
      ) : (
        <EmptyState
          title="No audit entries yet"
          body="Admin actions (approvals, edits, deletes, status changes) will appear here."
        />
      )}
    </div>
  );
}

function actionTone(family: string): "neutral" | "amber" | "green" | "red" | "blue" {
  switch (family) {
    case "seller": return "amber";
    case "product": return "blue";
    case "order": return "green";
    case "review": return "red";
    default: return "neutral";
  }
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
