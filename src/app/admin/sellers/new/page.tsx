import Link from "next/link";

import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, EmptyState } from "@/components/ui/Card";

export const metadata = { title: "Create shop for user — HomeMade Admin" };

export default async function NewSellerListPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireRole("admin");
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any;

  // Fetch users who are NOT admins AND who don't already own a seller_profile.
  // Supabase-js can't easily express a LEFT JOIN IS NULL, so we fetch seller ids
  // first and filter in memory — fine for the scale admin deals with (hundreds).
  const [{ data: sellerRows }, { data: profiles }] = await Promise.all([
    supabase.from("seller_profiles").select("id"),
    (q
      ? supabase
          .from("profiles")
          .select("id, full_name, phone, location, created_at, role")
          .ilike("full_name", `%${q}%`)
          .neq("role", "admin")
          .order("created_at", { ascending: false })
          .limit(200)
      : supabase
          .from("profiles")
          .select("id, full_name, phone, location, created_at, role")
          .neq("role", "admin")
          .order("created_at", { ascending: false })
          .limit(200)),
  ]);

  const existingSellerIds = new Set(((sellerRows ?? []) as { id: string }[]).map((s) => s.id));
  const candidates = ((profiles ?? []) as {
    id: string;
    full_name: string;
    phone: string | null;
    location: string | null;
    created_at: string;
  }[]).filter((p) => !existingSellerIds.has(p.id));

  return (
    <div className="space-y-6">
      <Link
        href="/admin/sellers"
        className="text-sm text-stone-400 transition hover:text-violet-600"
      >
        &larr; Back to sellers
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-stone-900">Create shop for a user</h1>
        <p className="mt-1 text-sm text-stone-500">
          Pick an existing customer and give them a shop. They keep browsing / buying as a customer;
          the shop is an extra capability on their account.
        </p>
      </div>

      <form method="get" className="flex gap-2">
        <input
          name="q"
          type="search"
          defaultValue={q}
          placeholder="Search by name…"
          className="flex-1 rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-200"
        />
        <button
          type="submit"
          className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-700"
        >
          Search
        </button>
      </form>

      {candidates.length > 0 ? (
        <Card>
          <ul className="divide-y divide-stone-100">
            {candidates.map((p) => (
              <li key={p.id} className="flex items-center gap-3 py-2.5">
                <div className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-gradient-to-br from-violet-100 to-sky-100 text-sm font-bold text-violet-700">
                  {p.full_name?.[0]?.toUpperCase() ?? "?"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-stone-900">{p.full_name}</p>
                  <p className="truncate text-xs text-stone-500">
                    {p.location ?? "No location"}
                    {p.phone ? ` · ${p.phone}` : ""}
                    {` · joined ${new Date(p.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`}
                  </p>
                </div>
                <Link
                  href={`/admin/sellers/new/${p.id}`}
                  className="rounded-full bg-violet-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-violet-700"
                >
                  Create shop
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      ) : (
        <EmptyState
          title={q ? "No users match that search" : "No customers without shops"}
          body={q ? "Try a different name." : "Every existing user already has a shop, or sign-ups are pending."}
        />
      )}
    </div>
  );
}
