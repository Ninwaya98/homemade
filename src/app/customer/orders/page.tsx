import Image from "next/image";
import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { Card, EmptyState } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { dayLabel, formatPrice } from "@/lib/constants";

export const metadata = { title: "My orders — HomeMade" };

export default async function CustomerOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ placed?: string }>;
}) {
  const profile = await requireAuth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any;
  const sp = await searchParams;
  const placed = sp.placed;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: orders } = await (supabase.from("orders") as any)
    .select(`
      id, status, quantity, total_cents, type, scheduled_for, created_at, vertical,
      products(name, photo_urls),
      seller_profiles!orders_seller_id_fkey(shop_name)
    `)
    .eq("customer_id", profile.id)
    .eq("vertical", "market")
    .order("created_at", { ascending: false })
    .limit(50);

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

      {orders && orders.length > 0 ? (
        <div className="space-y-3">
          {orders.map((o: {
            id: string; status: string; quantity: number; total_cents: number;
            type: string; scheduled_for: string | null; vertical: string;
            products: { name?: string; photo_urls?: string[] } | null;
            seller_profiles: { shop_name?: string } | null;
          }) => {
            const itemName = o.products?.name;
            const photoUrl = (o.products?.photo_urls ?? [])[0];
            const fromName = o.seller_profiles?.shop_name;

            return (
              <Link key={o.id} href={`/customer/orders/${o.id}`} className="block">
                <Card hover>
                  <div className="flex items-center gap-4">
                    {photoUrl ? (
                      <Image src={photoUrl} alt="" width={64} height={64} className="h-16 w-16 flex-none rounded-xl object-cover" />
                    ) : (
                      <div className="flex h-16 w-16 flex-none items-center justify-center rounded-xl bg-stone-100 text-2xl">
                        🛍
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-stone-900">
                          {o.quantity}× {itemName ?? "—"}
                        </p>
                        <Badge tone={statusTone(o.status)}>{o.status}</Badge>
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
          body="Browse HomeMade and place your first order."
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
