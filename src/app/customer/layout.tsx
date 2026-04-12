import Link from "next/link";

import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { NavLink } from "@/components/ui/NavLink";
import { BasketProvider } from "@/lib/basket";
import { BasketBadge } from "@/components/ui/BasketBadge";
import { ProfileDropdown } from "@/components/ui/ProfileDropdown";

export default async function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentProfile();
  const isLoggedIn = !!profile;

  let hasCookProfile = false;
  let hasSellerProfile = false;
  if (isLoggedIn) {
    const supabase = await createClient();
    const { data: cp } = await supabase
      .from("cook_profiles")
      .select("status")
      .eq("id", profile.id)
      .maybeSingle();
    hasCookProfile = !!cp;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: sp } = await (supabase as any)
      .from("seller_profiles")
      .select("status")
      .eq("id", profile.id)
      .maybeSingle();
    hasSellerProfile = !!sp;
  }

  const navItems = [
    { href: "/customer", label: "Home", icon: "◉" },
    { href: "/customer/kitchen", label: "Kitchen", icon: "🍽" },
    { href: "/customer/market", label: "Market", icon: "🛍" },
  ];

  return (
    <BasketProvider>
      <div className="min-h-screen gradient-mesh">
        <header className="glass-header sticky top-0 z-30">
          <div className="mx-auto max-w-3xl px-5 py-3">
            <div className="flex items-center justify-between">
              <Link href="/customer" className="text-lg font-black tracking-tight">
                <span className="gradient-text-animate">HomeMade</span>
              </Link>
              <div className="flex items-center gap-2">
                {isLoggedIn ? (
                  <>
                    {/* Basket icon */}
                    <Link
                      href="/customer/basket"
                      className="relative flex h-9 w-9 items-center justify-center rounded-full border border-stone-200 bg-white/70 text-sm transition hover:border-violet-300 hover:bg-violet-50"
                    >
                      <span className="text-sm">🧺</span>
                      <BasketBadge />
                    </Link>
                    {/* Profile */}
                    <ProfileDropdown
                      name={profile.full_name}
                      hasCookShop={hasCookProfile}
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
            <ul className="flex gap-1 overflow-x-auto pb-3 text-sm">
              {navItems.map((item) => (
                <li key={item.href}>
                  <NavLink
                    href={item.href}
                    exact={item.href === "/customer"}
                    className="flex items-center gap-1.5 rounded-full px-3.5 py-2 text-slate-600 transition hover:bg-violet-50 hover:text-violet-700"
                    activeClassName="flex items-center gap-1.5 rounded-full px-3.5 py-2 bg-violet-100 text-violet-800 font-medium shadow-sm"
                  >
                    <span className="text-xs">{item.icon}</span>
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </header>
        <main className="mx-auto max-w-3xl px-5 py-8 animate-fade-up">{children}</main>
      </div>
    </BasketProvider>
  );
}
