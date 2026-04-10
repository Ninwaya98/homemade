import Link from "next/link";

import { signOut } from "@/app/actions/auth";
import { getCurrentProfile } from "@/lib/auth";
import { NavLink } from "@/components/ui/NavLink";

export default async function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentProfile();
  const isCustomer = profile?.role === "customer";

  const navItems = [
    { href: "/customer", label: "Home", icon: "◉" },
    { href: "/customer/kitchen", label: "Kitchen", icon: "🍽" },
    { href: "/customer/market", label: "Market", icon: "🛍" },
    ...(isCustomer
      ? [{ href: "/customer/orders", label: "Orders", icon: "▤" }]
      : []),
  ];

  return (
    <div className="min-h-screen gradient-mesh">
      <header className="glass-header sticky top-0 z-30">
        <div className="mx-auto max-w-3xl px-5 py-4">
          <div className="flex items-center justify-between">
            <Link href="/customer" className="text-lg font-black tracking-tight">
              <span className="gradient-text-animate">HomeMade</span>
            </Link>
            <div className="flex items-center gap-3">
              {isCustomer ? (
                <>
                  <Link href="/account" className="text-sm text-slate-500 transition hover:text-violet-600">
                    Account
                  </Link>
                  <form action={signOut}>
                    <button
                      type="submit"
                      className="text-sm text-slate-500 transition hover:text-slate-900"
                    >
                      Sign out
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <Link
                    href="/sign-in"
                    className="text-sm text-slate-500 transition hover:text-violet-600"
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
          <p className="mt-1 text-sm text-slate-500">
            {isCustomer ? (
              <>Hi <span className="font-medium text-slate-700">{profile.full_name.split(" ")[0]}</span> — what are you looking for?</>
            ) : (
              "Explore home-cooked food & handmade goods"
            )}
          </p>
        </div>
        <nav className="mx-auto max-w-3xl px-5">
          <ul className="flex gap-1 overflow-x-auto pb-3 text-sm">
            {navItems.map((item) => (
              <li key={item.href}>
                <NavLink
                  href={item.href}
                  exact={item.href === "/customer"}
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
      </header>
      <main className="mx-auto max-w-3xl px-5 py-8 animate-fade-up">{children}</main>
    </div>
  );
}
