import Link from "next/link";

import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import { DeleteAccountForm } from "./delete-account-form";

export const metadata = {
  title: "Account Settings — HomeMade",
};

export default async function AccountPage() {
  const profile = await requireAuth();
  const supabase = await createClient();

  // Check seller capability
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: sellerProfile } = await (supabase as any)
    .from("seller_profiles")
    .select("status, shop_name")
    .eq("id", profile.id)
    .maybeSingle();

  return (
    <main className="mx-auto max-w-2xl px-5 py-14">
      <h1 className="text-2xl font-semibold text-slate-900">Account</h1>
      <p className="mt-2 text-sm text-slate-600">
        Signed in as <strong>{profile.full_name}</strong>
      </p>

      {/* ── Capabilities ───────────────────────────────────── */}
      <section className="mt-8 space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">Your roles</h2>

        {/* Seller capability */}
        {sellerProfile ? (
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-900">
                  HomeMade Art{sellerProfile.shop_name ? ` — ${sellerProfile.shop_name}` : ""}
                </p>
                <p className="text-sm text-slate-500">You applied to sell</p>
              </div>
              <Badge tone={sellerProfile.status === "approved" ? "green" : sellerProfile.status === "suspended" ? "red" : "amber"}>
                {sellerProfile.status}
              </Badge>
            </div>
            <div className="mt-3">
              <LinkButton href="/seller" size="sm" variant="secondary">
                Go to shop dashboard
              </LinkButton>
            </div>
          </Card>
        ) : (
          <Card>
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 flex-none items-center justify-center rounded-2xl bg-gradient-to-br from-violet-100 to-purple-200 text-2xl">
                🛍️
              </div>
              <div className="flex-1">
                <p className="font-semibold text-slate-900">Open a Shop</p>
                <p className="mt-1 text-sm text-slate-500">
                  Sell your handmade goods — crafts, clothing, decor, and more.
                </p>
                <div className="mt-3">
                  <LinkButton href="/seller/onboarding" size="sm">
                    Apply to sell
                  </LinkButton>
                </div>
              </div>
            </div>
          </Card>
        )}
      </section>

      {/* ── Delivery Addresses ─────────────────────────────── */}
      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-stone-100">Delivery Addresses</h2>
          <Link href="/account/addresses" className="text-sm text-violet-600 dark:text-violet-400 hover:underline">
            Manage addresses
          </Link>
        </div>
        <p className="mt-1 text-sm text-slate-500 dark:text-stone-400">
          Save addresses for faster checkout.
        </p>
      </section>

      <hr className="my-8 border-violet-200/40" />

      {/* ── Danger zone ────────────────────────────────────── */}
      <section>
        <h2 className="text-lg font-semibold text-red-900">Delete Account</h2>
        <p className="mt-2 text-sm text-slate-600">
          This will permanently delete your account and all associated data
          (profile, products, reviews). This action cannot be undone.
          If you have active orders, you must wait until they are completed or
          cancelled first.
        </p>
        <DeleteAccountForm />
      </section>
    </main>
  );
}
