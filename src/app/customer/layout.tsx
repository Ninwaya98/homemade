import Link from "next/link";

import { signOut } from "@/app/actions/auth";
import { requireRole } from "@/lib/auth";
import { NavLink } from "@/components/ui/NavLink";

export default async function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireRole("customer");

  const navItems = [
    { href: "/customer", label: "Browse" },
    { href: "/customer/orders", label: "Orders" },
  ];

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto max-w-3xl px-5 py-4">
          <div className="flex items-center justify-between">
            <Link href="/customer" className="text-lg font-semibold text-stone-900">
              Authentic Kitchen
            </Link>
            <div className="flex items-center gap-3">
              <Link href="/account" className="text-sm text-stone-500 hover:text-stone-900">
                Account
              </Link>
              <form action={signOut}>
                <button
                  type="submit"
                  className="text-sm text-stone-500 hover:text-stone-900"
                >
                  Sign out
                </button>
              </form>
            </div>
          </div>
          <p className="mt-1 text-sm text-stone-600">
            Hi {profile.full_name.split(" ")[0]} — what are you hungry for?
          </p>
        </div>
        <nav className="mx-auto max-w-3xl px-5">
          <ul className="flex gap-1 overflow-x-auto pb-2 text-sm">
            {navItems.map((item) => (
              <li key={item.href}>
                <NavLink
                  href={item.href}
                  exact={item.href === "/customer"}
                  className="block rounded-full px-3 py-1.5 text-stone-600 transition hover:bg-stone-100 hover:text-stone-900"
                  activeClassName="block rounded-full px-3 py-1.5 bg-amber-100 text-amber-900 font-medium"
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      <main className="mx-auto max-w-3xl px-5 py-8">{children}</main>
    </div>
  );
}
