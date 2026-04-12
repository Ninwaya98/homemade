"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { signOut } from "@/app/actions/auth";

export function ProfileDropdown({
  name,
  hasCookShop,
  hasSellerShop,
}: {
  name: string;
  hasCookShop: boolean;
  hasSellerShop: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const initial = name.trim().charAt(0).toUpperCase() || "?";
  const hasShop = hasCookShop || hasSellerShop;

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

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
        <div className="absolute right-0 top-full z-50 mt-2 w-56 origin-top-right animate-scale-in rounded-2xl glass-strong border border-violet-100 p-1.5 shadow-xl shadow-violet-500/10">
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

          {/* Shop links */}
          {hasShop && (
            <>
              <div className="my-1 border-t border-stone-200/60" />
              <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-stone-400">
                My shops
              </p>
              {hasCookShop && (
                <DropdownLink
                  href="/cook"
                  icon="🍳"
                  label="Kitchen dashboard"
                  onClick={() => setOpen(false)}
                />
              )}
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

          {/* Sign out */}
          <form action={signOut}>
            <button
              type="submit"
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-stone-600 transition hover:bg-red-50 hover:text-red-700"
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
