import Link from "next/link";

import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { NavLink } from "@/components/ui/NavLink";
import { ProfileDropdown } from "@/components/ui/ProfileDropdown";
import { NotificationBell } from "@/components/ui/NotificationBell";

export default async function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentProfile();
  const isLoggedIn = !!profile;

  let hasSellerProfile = false;
  if (isLoggedIn) {
    const supabase = await createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: sp } = await (supabase as any)
      .from("seller_profiles")
      .select("status")
      .eq("id", profile.id)
      .maybeSingle();
    hasSellerProfile = !!sp;
  }

  const navItems = [
    {
      href: "/customer",
      label: "Home",
      exact: true,
      defaultClass: "flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-2 text-slate-600 transition hover:bg-violet-50 hover:text-violet-700",
      activeClass: "flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-2 bg-violet-100 text-violet-800 font-medium shadow-sm",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1m-2 0h2" />
        </svg>
      ),
    },
    {
      href: "/customer/market",
      label: "HomeMade Art",
      exact: false,
      defaultClass: "flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-2 text-slate-600 transition hover:bg-sky-50 hover:text-sky-700",
      activeClass: "flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-2 bg-sky-100 text-sky-800 font-medium shadow-sm",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M7 20l3-3m0 0l2-8 8 2m-10 6l-6-6 8-2" />
          <circle cx="6" cy="18" r="2" />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen">
      <header className="glass-header relative z-30">
        <div className="mx-auto max-w-3xl px-5 py-3">
          <div className="flex items-center justify-between">
            <Link href="/customer" className="text-lg font-black tracking-tight">
              <span className="gradient-text-animate">HomeMade</span>
            </Link>
            <div className="flex items-center gap-2">
              {isLoggedIn ? (
                <>
                  <NotificationBell />
                  <ProfileDropdown
                    name={profile.full_name}
                    hasSellerShop={hasSellerProfile}
                  />
                </>
              ) : (
                <>
                  <Link
                    href="/sign-in"
                    className="text-sm text-slate-600 transition hover:text-violet-600"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/sign-up"
                    className="gradient-purple rounded-full px-4 py-1.5 text-sm font-semibold text-white shadow-sm shadow-violet-500/20 transition hover:shadow-lg"
                  >
                    Sign up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
        <nav className="mx-auto max-w-3xl px-5">
          <ul className="flex items-center gap-1 overflow-x-auto pb-3 text-sm">
            {navItems.map((item) => (
              <li key={item.href}>
                <NavLink
                  href={item.href}
                  exact={item.exact}
                  className={item.defaultClass}
                  activeClassName={item.activeClass}
                >
                  {item.icon}
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      <main className="mx-auto max-w-3xl px-5 py-8 animate-fade-up">{children}</main>
    </div>
  );
}
