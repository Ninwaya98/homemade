import Link from "next/link";

import { signOut } from "@/app/actions/auth";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { NavLink } from "@/components/ui/NavLink";

export default async function SellerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireRole("seller");
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
  ];
  const showNav = sellerProfile?.status === "approved";

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="glass-header sticky top-0 z-30 border-b border-stone-200/60">
        <div className="mx-auto max-w-3xl px-5 py-4">
          <div className="flex items-center justify-between">
            <Link href="/seller" className="text-lg font-bold text-stone-900">
              <span className="text-amber-700">H</span>omeMade Market
            </Link>
            <div className="flex items-center gap-3">
              <Link href="/account" className="text-sm text-stone-500 transition hover:text-amber-700">
                Account
              </Link>
              <form action={signOut}>
                <button
                  type="submit"
                  className="text-sm text-stone-500 transition hover:text-stone-900"
                >
                  Sign out
                </button>
              </form>
            </div>
          </div>
          <p className="mt-1 text-sm text-stone-500">
            Hi <span className="font-medium text-stone-700">{profile.full_name.split(" ")[0]}</span>
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
                    className="flex items-center gap-1.5 rounded-full px-3.5 py-2 text-stone-500 transition hover:bg-stone-100 hover:text-stone-900"
                    activeClassName="flex items-center gap-1.5 rounded-full px-3.5 py-2 bg-amber-100 text-amber-900 font-medium shadow-sm"
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
