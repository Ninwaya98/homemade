import Link from "next/link";

import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { NavLink } from "@/components/ui/NavLink";
import { ProfileDropdown } from "@/components/ui/ProfileDropdown";
import { NotificationBell } from "@/components/ui/NotificationBell";

export default async function CookLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireAuth();
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [{ data: cookProfile }, { data: sellerProfile }] = await Promise.all([
    supabase.from("cook_profiles").select("status").eq("id", profile.id).maybeSingle(),
    (supabase as any).from("seller_profiles").select("status").eq("id", profile.id).maybeSingle(),
  ]);

  const navItems = [
    { href: "/cook", label: "Today", icon: "◉" },
    { href: "/cook/dishes", label: "Dishes", icon: "◎" },
    { href: "/cook/schedule", label: "Schedule", icon: "▦" },
    { href: "/cook/orders", label: "Orders", icon: "▤" },
    { href: "/cook/earnings", label: "Earnings", icon: "$" },
    { href: "/cook/analytics", label: "Analytics", icon: "▥" },
    { href: "/cook/reviews", label: "Reviews", icon: "★" },
  ];
  const showNav = cookProfile?.status === "approved";

  return (
    <div className="min-h-screen gradient-mesh">
      <header className="glass-header z-30">
        <div className="mx-auto max-w-3xl px-5 py-4">
          <div className="flex items-center justify-between">
            <Link href="/cook" className="text-lg font-black tracking-tight">
              <span className="gradient-text-animate">HomeMade</span>
              <span className="ml-1 text-slate-600 dark:text-stone-300">Kitchen</span>
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
                hasCookShop={true}
                hasSellerShop={!!sellerProfile}
              />
            </div>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Hi <span className="font-medium text-slate-700 dark:text-stone-200">{profile.full_name.split(" ")[0]}</span> — your kitchen
          </p>
        </div>
        {showNav && (
          <nav className="mx-auto max-w-3xl px-5">
            <ul className="flex gap-1 overflow-x-auto pb-3 text-sm">
              {navItems.map((item) => (
                <li key={item.href}>
                  <NavLink
                    href={item.href}
                    exact={item.href === "/cook"}
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
