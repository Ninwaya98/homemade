import Link from "next/link";

import { signOut } from "@/app/actions/auth";
import { requireRole } from "@/lib/auth";
import { NavLink } from "@/components/ui/NavLink";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole("admin");

  const navItems = [
    { href: "/admin", label: "Cook approvals" },
    { href: "/admin/sellers", label: "Seller approvals" },
    { href: "/admin/cooks", label: "All cooks" },
    { href: "/admin/sellers/all", label: "All sellers" },
  ];

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-stone-200">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-6">
            <Link
              href="/admin"
              className="text-lg font-semibold text-stone-900"
            >
              HomeMade — Admin
            </Link>
            <nav className="flex gap-4 text-sm">
              {navItems.map((item) => (
                <NavLink
                  key={item.href}
                  href={item.href}
                  exact={item.href === "/admin"}
                  className="text-stone-600 hover:text-stone-900"
                  activeClassName="text-stone-900 font-medium"
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
          <form action={signOut}>
            <button
              type="submit"
              className="text-sm text-stone-500 hover:text-stone-900"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
