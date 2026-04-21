import Link from "next/link";

import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ProfileDropdown } from "@/components/ui/ProfileDropdown";
import { NotificationBell } from "@/components/ui/NotificationBell";
import { SessionSyncer } from "@/components/auth/SessionSyncer";

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireAuth();
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: sellerProfile } = await (supabase as any)
    .from("seller_profiles")
    .select("status")
    .eq("id", profile.id)
    .maybeSingle();
  const hasSellerShop = !!sellerProfile;

  return (
    <div className="min-h-screen">
      <SessionSyncer />
      <header className="glass-header relative z-30">
        <div className="mx-auto max-w-3xl px-5 py-3">
          <div className="flex items-center justify-between">
            <Link href="/customer" className="text-lg font-black tracking-tight">
              <span className="gradient-text-animate">HomeMade</span>
            </Link>
            <div className="flex items-center gap-2">
              <Link
                href="/customer"
                className="text-sm text-slate-500 transition hover:text-violet-600"
              >
                Browse
              </Link>
              <NotificationBell />
              <ProfileDropdown
                name={profile.full_name}
                hasSellerShop={hasSellerShop}
                isAdmin={profile.role === "admin"}
              />
            </div>
          </div>
        </div>
      </header>
      <main className="animate-fade-up">{children}</main>
    </div>
  );
}
