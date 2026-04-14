import Image from "next/image";
import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { Card, EmptyState } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { dayLabel, formatPrice, portionSizeLabel } from "@/lib/constants";

export const metadata = { title: "My orders — HomeMade" };

export default async function CustomerOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; placed?: string }>;
}) {
  const profile = await requireAuth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any;
  const sp = await searchParams;
  const filter = sp.filter ?? "all";
  const placed = sp.placed;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase.from("orders") as any)
    .select(`
      id, status, quantity, total_cents, type, scheduled_for, created_at, vertical, portion_size,
      dishes(name, photo_url),
      cook_profiles!orders_cook_id_fkey(profiles!cook_profiles_id_fkey(full_name)),
      products(name, photo_urls),
      seller_profiles!orders_seller_id_fkey(shop_name)
    `)
    .eq("customer_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (filter === "kitchen") query = query.eq("vertical", "kitchen");
  if (filter === "market") query = query.eq("vertical", "market");

  const { data: orders } = await query;

  return (
    <div className="space-y-6">
      {placed && (
        <Card className="border-emerald-200 bg-emerald-50">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-sm text-white">
              ✓
            </div>
            <p className="text-sm font-semibold text-emerald-900">
              {Number(placed) > 1
                ? `${placed} orders placed successfully!`
                : "Order placed successfully!"}
            </p>
          </div>
        </Card>
      )}

      <header>
        <h1 className="text-2xl font-bold text-stone-900">My orders</h1>
      </header>

      {/* Vertical filter */}
      <div className="flex gap-1.5">
        <FilterPill href="/customer/orders" active={filter === "all"}>All</FilterPill>
        <FilterPill href="/customer/orders?filter=kitchen" active={filter === "kitchen"}>Kitchen</FilterPill>
        <FilterPill href="/customer/orders?filter=market" active={filter === "market"}>Market</FilterPill>
      </div>

      {orders && orders.length > 0 ? (
        <div className="space-y-3">
          {orders.map((o: {
            id: string; status: string; quantity: number; total_cents: number;
            type: string; scheduled_for: string | null; vertical: string;
            dishes: { name?: string; photo_url?: string | null } | null;
            cook_profiles: { profiles?: { full_name?: string } } | null;
            products: { name?: string; photo_urls?: string[] } | null;
            seller_profiles: { shop_name?: string } | null;
          }) => {
            const isMarket = o.vertical === "market";
            const itemName = isMarket ? o.products?.name : o.dishes?.name;
            const photoUrl = isMarket
              ? (o.products?.photo_urls ?? [])[0]
              : o.dishes?.photo_url;
            const fromName = isMarket
              ? o.seller_profiles?.shop_name
              : o.cook_profiles?.profiles?.full_name;

            return (
              <Link key={o.id} href={`/customer/orders/${o.id}`} className="block">
                <Card hover>
                  <div className="flex items-center gap-4">
                    {photoUrl ? (
                      <Image src={photoUrl} alt="" width={64} height={64} className="h-16 w-16 flex-none rounded-xl object-cover" />
                    ) : (
                      <div className="flex h-16 w-16 flex-none items-center justify-center rounded-xl bg-stone-100 text-2xl">
                        {isMarket ? "🛍" : "🍽"}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-stone-900">
                          {o.quantity}× {itemName ?? "—"}
                          {(o as any).portion_size && (
                            <span className="ml-1 text-xs font-normal text-violet-600">
                              ({portionSizeLabel((o as any).portion_size)})
                            </span>
                          )}
                        </p>
                        <Badge tone={statusTone(o.status)}>{o.status}</Badge>
                        <Badge tone={isMarket ? "blue" : "amber"}>
                          {isMarket ? "Market" : "Kitchen"}
                        </Badge>
                      </div>
                      <p className="text-xs text-stone-500">
                        from {fromName ?? "—"}
                        {o.scheduled_for && ` · ${dayLabel(o.scheduled_for)}`}
                        {` · ${o.type}`}
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
          body="Browse the Kitchen or Market and place your first order."
        />
      )}
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
      className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
        active
          ? "border-violet-600 bg-violet-600 text-white shadow-sm shadow-violet-600/20"
          : "border-stone-200 bg-white text-stone-600 shadow-sm hover:border-violet-300 hover:text-violet-700"
      }`}
    >
      {children}
    </Link>
  );
}
