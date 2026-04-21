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
    { href: "/admin/sellers", label: "Seller approvals" },
    { href: "/admin/sellers/all", label: "All sellers" },
    { href: "/admin/reviews", label: "Reviews" },
  ];

  return (
    <div className="min-h-screen gradient-mesh">
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
          <form action={signOut}>
            <button
              type="submit"
              className="text-sm text-slate-500 hover:text-slate-900 transition"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8 animate-fade-up">{children}</main>
    </div>
  );
}
