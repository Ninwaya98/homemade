"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useTheme } from "@/lib/theme";
import { useClickOutside, useEscapeKey } from "@/lib/hooks";
import { AccountSwitcher } from "@/components/ui/AccountSwitcher";
import { SignOutButton } from "@/components/ui/SignOutButton";

export function ProfileDropdown({
  name,
  hasSellerShop,
  isAdmin = false,
}: {
  name: string;
  hasSellerShop: boolean;
  isAdmin?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"main" | "switcher">("main");
  const ref = useRef<HTMLDivElement>(null);
  const { theme, toggleTheme } = useTheme();

  const initial = name.trim().charAt(0).toUpperCase() || "?";

  function closeAll() {
    setOpen(false);
    setView("main");
  }

  useClickOutside(ref, closeAll, open);
  useEscapeKey(() => {
    if (view === "switcher") setView("main");
    else setOpen(false);
  }, open);

  return (
    <div ref={ref} className="relative">
      {/* Avatar button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
        className="flex h-9 w-9 items-center justify-center rounded-full gradient-purple text-sm font-bold text-white shadow-sm shadow-violet-500/20 transition hover:shadow-md hover:scale-105 active:scale-95 focus-ring"
      >
        {initial}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute right-0 top-full z-50 mt-2 w-64 origin-top-right animate-scale-in rounded-2xl border border-violet-100 p-1.5 shadow-xl shadow-violet-500/10"
          style={{ background: "var(--dropdown-bg, rgba(255,255,255,0.92))", backdropFilter: "blur(24px) saturate(200%)", WebkitBackdropFilter: "blur(24px) saturate(200%)" }}
        >
          {view === "main" ? (
            <>
              {/* Header */}
              <div className="px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-stone-900 truncate">{name}</p>
                  {isAdmin && (
                    <span className="rounded-full bg-violet-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-violet-700">
                      Admin
                    </span>
                  )}
                </div>
              </div>

              <div className="my-1 border-t border-stone-200/60" />

              {/* Admin (shown first so admins always have a way back to /admin) */}
              {isAdmin && (
                <>
                  <DropdownLink
                    href="/admin"
                    icon="◆"
                    label="Admin panel"
                    onClick={closeAll}
                  />
                  <div className="my-1 border-t border-stone-200/60" />
                </>
              )}

              {/* My Account */}
              <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-stone-400">
                My account
              </p>
              <DropdownLink
                href="/customer/orders"
                icon="▤"
                label="My orders"
                onClick={closeAll}
              />
              <DropdownLink
                href="/customer/favorites"
                icon="♡"
                label="My favorites"
                onClick={closeAll}
              />
              {hasSellerShop && (
                <DropdownLink
                  href="/seller"
                  icon="🛍"
                  label="Market dashboard"
                  onClick={closeAll}
                />
              )}

              <div className="my-1 border-t border-stone-200/60" />

              {/* Settings */}
              <DropdownLink
                href="/account"
                icon="⚙"
                label="Settings"
                onClick={closeAll}
              />

              {/* Switch account — opens sub-view */}
              <button
                type="button"
                onClick={() => setView("switcher")}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-stone-700 dark:text-stone-300 transition hover:bg-violet-50 dark:hover:bg-violet-900/30 hover:text-violet-800 dark:hover:text-violet-300"
              >
                <span className="text-xs">⇄</span>
                Switch account
                <span className="ml-auto text-xs text-stone-400">›</span>
              </button>

              <div className="my-1 border-t border-stone-200/60" />

              {/* Dark mode */}
              <button
                type="button"
                onClick={toggleTheme}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-stone-700 dark:text-stone-300 transition hover:bg-violet-50 dark:hover:bg-violet-900/30 hover:text-violet-800 dark:hover:text-violet-300"
              >
                <span className="text-xs">{theme === "dark" ? "☀" : "🌙"}</span>
                {theme === "dark" ? "Light mode" : "Dark mode"}
              </button>

              {/* Sign out */}
              <SignOutButton />
            </>
          ) : (
            <>
              {/* Switcher sub-view header (back button) */}
              <button
                type="button"
                onClick={() => setView("main")}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-stone-700 dark:text-stone-300 transition hover:bg-violet-50 dark:hover:bg-violet-900/30 hover:text-violet-800"
              >
                <span className="text-xs">←</span>
                <span className="font-semibold">Switch account</span>
              </button>

              <div className="my-1 border-t border-stone-200/60" />

              <AccountSwitcher onNavigate={closeAll} hideHeading />
            </>
          )}
        </div>
      )}
    </div>
  );
}

function DropdownLink({
  href,
  icon,
  label,
  onClick,
}: {
  href: string;
  icon: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-stone-700 transition hover:bg-violet-50 hover:text-violet-800"
    >
      <span className="text-xs">{icon}</span>
      {label}
    </Link>
  );
}
