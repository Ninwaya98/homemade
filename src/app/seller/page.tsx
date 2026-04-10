import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { Card } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import { productCategoryLabel } from "@/lib/constants";

export const metadata = {
  title: "My shop — HomeMade Market",
};

export default async function SellerHome({
  searchParams,
}: {
  searchParams: Promise<{ onboarded?: string }>;
}) {
  const profile = await getCurrentProfile();
  const supabase = await createClient();
  const { onboarded } = await searchParams;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: sellerProfile } = await (supabase as any)
    .from("seller_profiles")
    .select("*")
    .eq("id", profile!.id)
    .maybeSingle();

  // No seller profile yet → onboarding CTA.
  if (!sellerProfile) {
    return (
      <div className="space-y-6">
        <Card>
          <h1 className="text-2xl font-bold text-stone-900">
            Welcome to HomeMade Market
          </h1>
          <p className="mt-2 text-stone-600">
            Set up your shop in a few minutes. Tell us about yourself,
            what you make, and you&apos;ll be selling to local customers
            in no time.
          </p>
          <div className="mt-5">
            <LinkButton href="/seller/onboarding" size="lg">
              Set up my shop
            </LinkButton>
          </div>
        </Card>
      </div>
    );
  }

  // Pending review.
  if (sellerProfile.status === "pending") {
    return (
      <div className="space-y-6">
        {onboarded && (
          <Card className="bg-emerald-50 border-emerald-200">
            <h2 className="text-base font-semibold text-emerald-900">
              Submitted for review
            </h2>
            <p className="mt-1 text-sm text-emerald-900/80">
              Thanks {profile!.full_name.split(" ")[0]} — our team will
              review your shop within 1–2 days.
            </p>
          </Card>
        )}
        <Card>
          <h1 className="text-2xl font-bold text-stone-900">
            Pending admin review
          </h1>
          <p className="mt-2 text-stone-600">
            We&apos;re reviewing your shop details. Once approved, your
            products will go live and customers can find you.
          </p>
          <div className="mt-5 flex gap-3">
            <LinkButton href="/seller/onboarding" variant="secondary" size="md">
              Edit my shop
            </LinkButton>
          </div>
        </Card>
      </div>
    );
  }

  // Suspended.
  if (sellerProfile.status === "suspended") {
    return (
      <Card className="border-red-200 bg-red-50">
        <h1 className="text-xl font-bold text-red-900">
          Your shop is suspended
        </h1>
        <p className="mt-2 text-sm text-red-900/80">
          Please reach out to our support team. Your products are not
          visible to customers right now.
        </p>
      </Card>
    );
  }

  // Approved — show shop dashboard.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count: totalProducts } = await (supabase as any).from("products")
    .select("*", { count: "exact", head: true })
    .eq("seller_id", profile!.id)
    .eq("status", "active");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: pendingOrders } = await (supabase as any).from("orders")
    .select("id, quantity, status, products(name)")
    .eq("seller_id", profile!.id)
    .eq("vertical", "market")
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(10);

  return (
    <div className="space-y-6">
      {pendingOrders && pendingOrders.length > 0 && (
        <Card className="border-violet-300 bg-violet-50">
          <h2 className="text-base font-semibold text-violet-900">
            {pendingOrders.length} new order{pendingOrders.length === 1 ? "" : "s"} need your attention
          </h2>
          <ul className="mt-3 divide-y divide-violet-200">
            {pendingOrders.map((o: { id: string; quantity: number; products: { name: string } | null }) => (
              <li key={o.id} className="flex items-center justify-between py-2.5">
                <p className="text-sm font-medium text-violet-900">
                  {o.quantity}× {o.products?.name ?? "—"}
                </p>
                <LinkButton
                  href={`/seller/orders/${o.id}`}
                  size="sm"
                  variant="primary"
                >
                  Review
                </LinkButton>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card>
        <h1 className="text-2xl font-bold text-stone-900">
          {sellerProfile.shop_name}
        </h1>
        <p className="mt-1 text-sm text-stone-500">
          {productCategoryLabel(sellerProfile.category)} · Your shop is live
        </p>
        {sellerProfile.shop_description && (
          <p className="mt-3 text-sm text-stone-600">{sellerProfile.shop_description}</p>
        )}
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-stone-900">Products</h2>
            <p className="text-sm text-stone-500">
              {totalProducts ?? 0} active {totalProducts === 1 ? "product" : "products"}
            </p>
          </div>
          <LinkButton href="/seller/products" variant="secondary" size="sm">
            Manage products
          </LinkButton>
        </div>
      </Card>
    </div>
  );
}
