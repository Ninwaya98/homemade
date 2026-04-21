"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { signOut } from "@/app/actions/auth";
import { useTheme } from "@/lib/theme";
import { useClickOutside, useEscapeKey } from "@/lib/hooks";

export function ProfileDropdown({
  name,
  hasSellerShop,
}: {
  name: string;
  hasSellerShop: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { theme, toggleTheme } = useTheme();

  const initial = name.trim().charAt(0).toUpperCase() || "?";
  const hasShop = hasSellerShop;

  useClickOutside(ref, () => setOpen(false), open);
  useEscapeKey(() => setOpen(false), open);

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
          className="absolute right-0 top-full z-50 mt-2 w-56 origin-top-right animate-scale-in rounded-2xl border border-violet-100 p-1.5 shadow-xl shadow-violet-500/10"
          style={{ background: "var(--dropdown-bg, rgba(255,255,255,0.92))", backdropFilter: "blur(24px) saturate(200%)", WebkitBackdropFilter: "blur(24px) saturate(200%)" }}
        >
          {/* Header */}
          <div className="px-3 py-2.5">
            <p className="text-sm font-semibold text-stone-900 truncate">{name}</p>
          </div>

          <div className="my-1 border-t border-stone-200/60" />

          {/* Account & Orders */}
          <DropdownLink
            href="/account"
            icon="⚙"
            label="Account settings"
            onClick={() => setOpen(false)}
          />
          <DropdownLink
            href="/customer/orders"
            icon="▤"
            label="My orders"
            onClick={() => setOpen(false)}
          />
          <DropdownLink
            href="/customer/favorites"
            icon="♡"
            label="My favorites"
            onClick={() => setOpen(false)}
          />

          {/* Shop links */}
          {hasShop && (
            <>
              <div className="my-1 border-t border-stone-200/60" />
              <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-stone-400">
                My shop
              </p>
              {hasSellerShop && (
                <DropdownLink
                  href="/seller"
                  icon="🛍"
                  label="Market dashboard"
                  onClick={() => setOpen(false)}
                />
              )}
            </>
          )}

          <div className="my-1 border-t border-stone-200/60" />

          {/* Theme toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-stone-700 dark:text-stone-300 transition hover:bg-violet-50 dark:hover:bg-violet-900/30 hover:text-violet-800 dark:hover:text-violet-300"
          >
            <span className="text-xs">{theme === "dark" ? "☀" : "🌙"}</span>
            {theme === "dark" ? "Light mode" : "Dark mode"}
          </button>

          {/* Sign out */}
          <form action={signOut}>
            <button
              type="submit"
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-stone-600 dark:text-stone-400 transition hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 dark:hover:text-red-400"
            >
              <span className="text-xs">↩</span>
              Sign out
            </button>
          </form>
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
