import { LinkButton } from "@/components/ui/Button";

interface ShopCTASectionProps {
  isLoggedIn: boolean;
  hasSellerShop: boolean;
  sellerStatus: string | null;
  sellerShopName: string | null;
}

export function ShopCTASection({
  isLoggedIn,
  hasSellerShop,
  sellerStatus,
}: ShopCTASectionProps) {
  return (
    <section className="grid gap-4 grid-cols-1">
      {hasSellerShop ? (
        <div className="relative overflow-hidden rounded-3xl glass-strong p-6">
          <div className="pointer-events-none absolute inset-0 rounded-3xl border-l-[3px] border-t-[3px] border-sky-300/60" />
          <div className="pointer-events-none absolute inset-0 rounded-3xl" style={{background:"linear-gradient(135deg, rgba(186,230,253,0.25) 0%, transparent 40%)"}} />
          <div className="relative">
            <h3 className="text-base font-bold text-stone-900">Your Shop</h3>
            <span className={`inline-block mt-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
              sellerStatus === "approved" ? "bg-emerald-50 text-emerald-700" : sellerStatus === "suspended" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"
            }`}>
              {sellerStatus}
            </span>
            <p className="mt-3 text-sm text-stone-500">
              Manage your products, orders, and earnings.
            </p>
            <div className="mt-4 flex gap-2">
              <LinkButton href="/seller" size="sm" variant="secondary">
                Go to dashboard
              </LinkButton>
              {sellerStatus === "approved" && (
                <LinkButton href="/seller/orders" size="sm" variant="secondary">
                  Orders
                </LinkButton>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="relative overflow-hidden rounded-3xl glass-strong p-6">
          <div className="pointer-events-none absolute inset-0 rounded-3xl border-l-[3px] border-t-[3px] border-sky-300/60" />
          <div className="pointer-events-none absolute inset-0 rounded-3xl" style={{background:"linear-gradient(135deg, rgba(186,230,253,0.25) 0%, transparent 40%)"}} />
          <div className="relative">
            <h3 className="text-base font-bold text-stone-900">Sell what you make</h3>
            <p className="mt-1 text-sm text-stone-500">
              Your handmade goods deserve an audience. List your crafts, clothing, decor, or packaged food.
            </p>
            <div className="mt-4">
              <LinkButton href={isLoggedIn ? "/seller/onboarding" : "/sign-up"} size="sm" variant="secondary">
                Open your shop
              </LinkButton>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
