import Link from "next/link";

import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { NavLink } from "@/components/ui/NavLink";
import { ProfileDropdown } from "@/components/ui/ProfileDropdown";
import { NotificationBell } from "@/components/ui/NotificationBell";
import { SessionSyncer } from "@/components/auth/SessionSyncer";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireRole("admin");

  // Admin might also own a seller shop — surface the dashboard link in
  // their profile dropdown if so.
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: sellerProfile } = await (supabase as any)
    .from("seller_profiles")
    .select("status")
    .eq("id", profile.id)
    .maybeSingle();
  const hasSellerShop = !!sellerProfile;

  const navItems = [
    { href: "/admin/sellers", label: "Seller approvals" },
    { href: "/admin/sellers/all", label: "All sellers" },
    { href: "/admin/reviews", label: "Reviews" },
  ];

  return (
    <div className="min-h-screen gradient-mesh">
      <SessionSyncer />
      <header className="glass-header relative z-30">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-6">
            <Link
              href="/admin"
              className="text-lg font-black tracking-tight"
            >
              <span className="gradient-text-animate">HomeMade</span>
              <span className="ml-1 text-slate-600">Admin</span>
            </Link>
            <nav className="flex gap-4 text-sm">
              {navItems.map((item) => (
                <NavLink
                  key={item.href}
                  href={item.href}
                  exact={item.href === "/admin"}
                  className="text-slate-500 hover:text-violet-600 transition"
                  activeClassName="text-violet-700 font-medium"
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
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
            />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8 animate-fade-up">{children}</main>
    </div>
  );
}
