import Link from "next/link";

import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { NavLink } from "@/components/ui/NavLink";
import { ProfileDropdown } from "@/components/ui/ProfileDropdown";
import { NotificationBell } from "@/components/ui/NotificationBell";
import { SessionSyncer } from "@/components/auth/SessionSyncer";

export default async function SellerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireAuth();
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: sellerProfile } = await (supabase as any)
    .from("seller_profiles")
    .select("status, shop_name")
    .eq("id", profile.id)
    .maybeSingle();

  const navItems = [
    { href: "/seller", label: "Dashboard", icon: "◉" },
    { href: "/seller/products", label: "Products", icon: "◎" },
    { href: "/seller/orders", label: "Orders", icon: "▤" },
    { href: "/seller/earnings", label: "Earnings", icon: "$" },
    { href: "/seller/reviews", label: "Reviews", icon: "★" },
  ];
  const showNav = sellerProfile?.status === "approved";

  return (
    <div className="min-h-screen gradient-mesh">
      <SessionSyncer />
      <header className="glass-header relative z-30">
        <div className="mx-auto max-w-3xl px-5 py-4">
          <div className="flex items-center justify-between">
            <Link href="/seller" className="text-lg font-black tracking-tight">
              <span className="gradient-text-animate">HomeMade</span>
              <span className="ml-1 text-slate-600 dark:text-stone-300">Art</span>
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
                hasSellerShop={true}
              />
            </div>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Hi <span className="font-medium text-slate-700 dark:text-stone-200">{profile.full_name.split(" ")[0]}</span>
            {sellerProfile?.shop_name && (
              <> — {sellerProfile.shop_name}</>
            )}
          </p>
        </div>
        {showNav && (
          <nav className="mx-auto max-w-3xl px-5">
            <ul className="flex gap-1 overflow-x-auto pb-3 text-sm">
              {navItems.map((item) => (
                <li key={item.href}>
                  <NavLink
                    href={item.href}
                    exact={item.href === "/seller"}
                    className="flex items-center gap-1.5 rounded-full px-3.5 py-2 text-slate-500 transition hover:bg-violet-50 hover:text-violet-700"
                    activeClassName="flex items-center gap-1.5 rounded-full px-3.5 py-2 bg-violet-100 text-violet-800 font-medium shadow-sm"
                  >
                    <span className="text-xs">{item.icon}</span>
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </header>
      <main className="mx-auto max-w-3xl px-5 py-8 animate-fade-up">{children}</main>
    </div>
  );
}
