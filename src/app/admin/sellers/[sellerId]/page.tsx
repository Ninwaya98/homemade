import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";

import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatPrice, productCategoryLabel } from "@/lib/constants";
import {
  adminDeleteProduct,
  adminSetOrderStatus,
  adminSetProductStatus,
  approveSeller,
  rejectSeller,
  reinstateSeller,
} from "@/app/admin/actions";
import { AdminSellerEditForm } from "./edit-form";

export const metadata = { title: "Seller detail — HomeMade Admin" };

export default async function AdminSellerDetailPage({
  params,
}: {
  params: Promise<{ sellerId: string }>;
}) {
  await requireRole("admin");
  const { sellerId } = await params;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any;

  const { data: seller } = await supabase
    .from("seller_profiles")
    .select(
      "*, profiles!seller_profiles_id_fkey(full_name, phone, location, created_at)",
    )
    .eq("id", sellerId)
    .maybeSingle();

  if (!seller) notFound();

  const ownerName = seller.profiles?.full_name ?? "—";
  const ownerPhone = seller.profiles?.phone ?? "";
  const ownerLocation = seller.profiles?.location ?? "";

  const [
    { data: products },
    { data: recentOrders },
    { data: recentReviews },
  ] = await Promise.all([
    supabase
      .from("products")
      .select("id, name, price_cents, stock_quantity, status, photo_urls, category, created_at")
      .eq("seller_id", sellerId)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("orders")
      .select("id, status, total_cents, quantity, created_at, products(name)")
      .eq("seller_id", sellerId)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("reviews")
      .select("id, sentiment, text, created_at, role, reviewer:profiles!reviews_reviewer_id_fkey(full_name)")
      .eq("reviewee_id", sellerId)
      .eq("role", "customer")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const activeProducts = (products ?? []).filter((p: { status: string }) => p.status === "active").length;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Link
        href="/admin/sellers/all"
        className="text-sm text-stone-400 transition hover:text-violet-600"
      >
        &larr; All sellers
      </Link>

      {/* Header */}
      <div className="flex items-start gap-5">
        {seller.photo_url ? (
          <Image
            src={seller.photo_url}
            alt={seller.shop_name}
            width={72}
            height={72}
            className="h-18 w-18 flex-none rounded-2xl object-cover shadow-sm"
          />
        ) : (
          <div className="flex h-18 w-18 flex-none items-center justify-center rounded-2xl bg-gradient-to-br from-violet-100 to-sky-100 text-2xl font-bold text-violet-700">
            {seller.shop_name?.[0]?.toUpperCase() ?? "?"}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-stone-900">
              {seller.shop_name}
            </h1>
            <Badge
              tone={
                seller.status === "approved"
                  ? "green"
                  : seller.status === "suspended"
                  ? "red"
                  : "amber"
              }
            >
              {seller.status}
            </Badge>
            <Badge tone="neutral">{productCategoryLabel(seller.category)}</Badge>
          </div>
          <p className="mt-1 text-sm text-stone-600">
            Owner: <span className="font-medium text-stone-800">{ownerName}</span>
          </p>
          <p className="text-xs text-stone-500">
            {ownerLocation || "No location set"} · {ownerPhone || "No phone set"}
          </p>
          {seller.shop_description && (
            <p className="mt-3 text-sm text-stone-700 whitespace-pre-wrap">
              {seller.shop_description}
            </p>
          )}
        </div>
      </div>

      {/* Moderation actions */}
      <Card>
        <h2 className="text-sm font-bold text-stone-900">Moderation</h2>
        <p className="mt-1 text-xs text-stone-500">
          Current status: <span className="font-medium">{seller.status}</span>
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {seller.status === "pending" && (
            <>
              <form
                action={async () => {
                  "use server";
                  await approveSeller(sellerId);
                }}
              >
                <button
                  type="submit"
                  className="rounded-full bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-emerald-700"
                >
                  Approve
                </button>
              </form>
              <form
                action={async () => {
                  "use server";
                  await rejectSeller(sellerId);
                }}
              >
                <button
                  type="submit"
                  className="rounded-full border border-red-300 bg-white px-4 py-1.5 text-sm font-medium text-red-700 transition hover:bg-red-50"
                >
                  Reject
                </button>
              </form>
            </>
          )}
          {seller.status === "approved" && (
            <form
              action={async () => {
                "use server";
                await rejectSeller(sellerId);
              }}
            >
              <button
                type="submit"
                className="rounded-full border border-red-300 bg-white px-4 py-1.5 text-sm font-medium text-red-700 transition hover:bg-red-50"
              >
                Suspend
              </button>
            </form>
          )}
          {seller.status === "suspended" && (
            <form
              action={async () => {
                "use server";
                await reinstateSeller(sellerId);
              }}
            >
              <button
                type="submit"
                className="rounded-full bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-emerald-700"
              >
                Reinstate
              </button>
            </form>
          )}
        </div>
      </Card>

      {/* Edit shop form */}
      <Card>
        <h2 className="text-sm font-bold text-stone-900">Edit shop profile</h2>
        <p className="mt-1 text-xs text-stone-500">
          Leave any field blank to keep the current value.
        </p>
        <AdminSellerEditForm
          sellerId={sellerId}
          initialValues={{
            shop_name: seller.shop_name ?? "",
            shop_description: seller.shop_description ?? "",
            category: seller.category ?? "",
            phone: ownerPhone,
            location: ownerLocation,
          }}
        />
      </Card>

      {/* Products */}
      <Card>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-bold text-stone-900">
            Products ({activeProducts} active, {(products ?? []).length} total)
          </h2>
          <Link
            href={`/admin/sellers/${sellerId}/products/new`}
            className="rounded-full bg-violet-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-violet-700"
          >
            + Add product
          </Link>
        </div>
        {(products ?? []).length > 0 ? (
          <ul className="mt-3 divide-y divide-stone-100">
            {(products as { id: string; name: string; price_cents: number; stock_quantity: number; status: string; category: string; photo_urls: string[] }[]).map((p) => (
              <li key={p.id} className="flex flex-wrap items-center gap-3 py-2.5">
                {p.photo_urls?.[0] ? (
                  <Image
                    src={p.photo_urls[0]}
                    alt=""
                    width={40}
                    height={40}
                    className="h-10 w-10 flex-none rounded-lg object-cover"
                  />
                ) : (
                  <div className="h-10 w-10 flex-none rounded-lg bg-stone-100" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-stone-900">
                    {p.name}
                  </p>
                  <p className="text-xs text-stone-500">
                    {productCategoryLabel(p.category)} · {p.stock_quantity} in stock
                  </p>
                </div>
                <Badge
                  tone={
                    p.status === "active"
                      ? "green"
                      : p.status === "out_of_stock"
                      ? "amber"
                      : "neutral"
                  }
                >
                  {p.status.replace("_", " ")}
                </Badge>
                <p className="text-sm font-medium text-stone-900">
                  {formatPrice(p.price_cents)}
                </p>
                <div className="flex items-center gap-1.5">
                  <Link
                    href={`/admin/sellers/${sellerId}/products/${p.id}`}
                    className="rounded-full border border-stone-200 bg-white px-2.5 py-1 text-xs font-medium text-stone-600 transition hover:border-violet-300 hover:text-violet-700"
                  >
                    Edit
                  </Link>
                  {p.status === "active" ? (
                    <form
                      action={async () => {
                        "use server";
                        await adminSetProductStatus(sellerId, p.id, "paused");
                      }}
                    >
                      <button
                        type="submit"
                        className="rounded-full border border-amber-300 bg-white px-2.5 py-1 text-xs font-medium text-amber-700 transition hover:bg-amber-50"
                      >
                        Pause
                      </button>
                    </form>
                  ) : (
                    <form
                      action={async () => {
                        "use server";
                        await adminSetProductStatus(sellerId, p.id, "active");
                      }}
                    >
                      <button
                        type="submit"
                        className="rounded-full border border-emerald-300 bg-white px-2.5 py-1 text-xs font-medium text-emerald-700 transition hover:bg-emerald-50"
                      >
                        Activate
                      </button>
                    </form>
                  )}
                  <form
                    action={async () => {
                      "use server";
                      await adminDeleteProduct(sellerId, p.id);
                    }}
                  >
                    <button
                      type="submit"
                      className="rounded-full border border-red-300 bg-white px-2.5 py-1 text-xs font-medium text-red-700 transition hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-stone-500">No products yet.</p>
        )}
      </Card>

      {/* Recent orders */}
      <Card>
        <h2 className="text-sm font-bold text-stone-900">Recent orders</h2>
        {(recentOrders ?? []).length > 0 ? (
          <ul className="mt-3 divide-y divide-stone-100">
            {(recentOrders as { id: string; status: string; total_cents: number; quantity: number; created_at: string; products: { name?: string } | null }[]).map((o) => (
              <li key={o.id} className="flex flex-wrap items-center gap-2 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-stone-900">
                    {o.quantity}× {o.products?.name ?? "—"}
                  </p>
                  <p className="text-xs text-stone-500">
                    {new Date(o.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <Badge
                  tone={
                    o.status === "completed"
                      ? "green"
                      : o.status === "cancelled"
                      ? "red"
                      : "blue"
                  }
                >
                  {o.status}
                </Badge>
                <p className="text-sm font-medium text-stone-900">
                  {formatPrice(o.total_cents)}
                </p>
                <div className="flex items-center gap-1.5">
                  {o.status === "pending" && (
                    <form
                      action={async () => {
                        "use server";
                        await adminSetOrderStatus(o.id, "confirmed");
                      }}
                    >
                      <button
                        type="submit"
                        className="rounded-full border border-blue-300 bg-white px-2.5 py-1 text-xs font-medium text-blue-700 transition hover:bg-blue-50"
                      >
                        Confirm
                      </button>
                    </form>
                  )}
                  {o.status === "confirmed" && (
                    <form
                      action={async () => {
                        "use server";
                        await adminSetOrderStatus(o.id, "ready");
                      }}
                    >
                      <button
                        type="submit"
                        className="rounded-full border border-blue-300 bg-white px-2.5 py-1 text-xs font-medium text-blue-700 transition hover:bg-blue-50"
                      >
                        Mark ready
                      </button>
                    </form>
                  )}
                  {o.status === "ready" && (
                    <form
                      action={async () => {
                        "use server";
                        await adminSetOrderStatus(o.id, "completed");
                      }}
                    >
                      <button
                        type="submit"
                        className="rounded-full border border-emerald-300 bg-white px-2.5 py-1 text-xs font-medium text-emerald-700 transition hover:bg-emerald-50"
                      >
                        Complete
                      </button>
                    </form>
                  )}
                  {(o.status === "pending" || o.status === "confirmed") && (
                    <form
                      action={async () => {
                        "use server";
                        await adminSetOrderStatus(o.id, "cancelled");
                      }}
                    >
                      <button
                        type="submit"
                        className="rounded-full border border-red-300 bg-white px-2.5 py-1 text-xs font-medium text-red-700 transition hover:bg-red-50"
                      >
                        Cancel
                      </button>
                    </form>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-stone-500">No orders yet.</p>
        )}
      </Card>

      {/* Recent reviews */}
      <Card>
        <h2 className="text-sm font-bold text-stone-900">Recent reviews</h2>
        {(recentReviews ?? []).length > 0 ? (
          <ul className="mt-3 space-y-3">
            {(recentReviews as { id: string; sentiment: string; text: string | null; created_at: string; reviewer: { full_name?: string } | null }[]).map((r) => (
              <li key={r.id} className="rounded-xl bg-stone-50 p-3">
                <div className="flex items-center gap-2">
                  <Badge tone={r.sentiment === "like" ? "green" : "red"}>
                    {r.sentiment === "like" ? "👍 Liked" : "👎 Disliked"}
                  </Badge>
                  <p className="text-xs text-stone-500">
                    {r.reviewer?.full_name ?? "Anonymous"} ·{" "}
                    {new Date(r.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
                {r.text && (
                  <p className="mt-1.5 text-sm text-stone-700 whitespace-pre-wrap">
                    {r.text}
                  </p>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-stone-500">No reviews yet.</p>
        )}
      </Card>
    </div>
  );
}
