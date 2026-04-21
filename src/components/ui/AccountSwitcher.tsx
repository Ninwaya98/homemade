"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import {
  getStoredAccounts,
  getActiveUserId,
  removeAccount,
  switchToAccount,
  type StoredAccount,
} from "@/lib/account-switcher";

/**
 * Instagram-style account switcher. Shows every account the user has
 * signed into on this device, with the current one marked. Clicking a
 * non-active account swaps the Supabase session and full-reloads the
 * page so server components render under the new identity.
 *
 * Consumed by ProfileDropdown.
 */
export function AccountSwitcher({
  onNavigate,
  hideHeading = false,
}: {
  onNavigate?: () => void;
  hideHeading?: boolean;
}) {
  const [accounts, setAccounts] = useState<StoredAccount[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [switchingId, setSwitchingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    setAccounts(getStoredAccounts());
    setActiveId(getActiveUserId());

    // Keep in sync with other tabs.
    const onStorage = (e: StorageEvent) => {
      if (e.key === "homemade-accounts") {
        setAccounts(getStoredAccounts());
        setActiveId(getActiveUserId());
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  async function handleSwitch(userId: string) {
    if (userId === activeId) return;
    setSwitchingId(userId);
    setError(null);
    try {
      await switchToAccount(userId);
      // Full reload so SSR layouts refetch with the new user.
      window.location.href = "/customer";
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not switch account");
      setAccounts(getStoredAccounts());
      setActiveId(getActiveUserId());
      setSwitchingId(null);
    }
  }

  function handleRemove(userId: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    startTransition(() => {
      removeAccount(userId);
      setAccounts(getStoredAccounts());
      setActiveId(getActiveUserId());
    });
  }

  // Don't render section if there's nothing meaningful yet (0 or 1 account
  // AND the active one is already shown in the dropdown header). In that
  // case we still want to expose "Add another account" from the dropdown.
  if (accounts.length === 0) {
    return (
      <Link
        href="/sign-in?mode=add"
        onClick={onNavigate}
        className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-stone-700 dark:text-stone-300 transition hover:bg-violet-50 dark:hover:bg-violet-900/30 hover:text-violet-800 dark:hover:text-violet-300"
      >
        <span className="text-xs">+</span>
        Add another account
      </Link>
    );
  }

  return (
    <div>
      {!hideHeading && (
        <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-stone-400">
          Accounts
        </p>
      )}

      {accounts.map((acc) => {
        const isActive = acc.userId === activeId;
        const isSwitching = switchingId === acc.userId;
        return (
          <button
            type="button"
            key={acc.userId}
            onClick={() => handleSwitch(acc.userId)}
            disabled={isSwitching}
            className={`group flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition ${
              isActive
                ? "bg-violet-50 text-violet-900 dark:bg-violet-900/30 dark:text-violet-200"
                : "text-stone-700 dark:text-stone-300 hover:bg-violet-50 dark:hover:bg-violet-900/30 hover:text-violet-800 dark:hover:text-violet-300"
            } disabled:opacity-60`}
          >
            <span
              className="flex h-7 w-7 flex-none items-center justify-center rounded-full gradient-purple text-[11px] font-bold text-white shadow-sm shadow-violet-500/20"
              aria-hidden
            >
              {acc.initial}
            </span>
            <div className="min-w-0 flex-1 text-left">
              <p className="truncate text-sm font-medium">{acc.fullName}</p>
              {acc.email && (
                <p className="truncate text-[10px] text-stone-500 dark:text-stone-400">
                  {acc.email}
                </p>
              )}
            </div>
            {isActive && !isSwitching && (
              <span className="text-[10px] font-semibold text-violet-600 dark:text-violet-400">
                Active
              </span>
            )}
            {isSwitching && (
              <span className="text-[10px] text-stone-500">Switching…</span>
            )}
            {!isActive && !isSwitching && (
              <span
                role="button"
                tabIndex={0}
                aria-label={`Remove ${acc.fullName}`}
                onClick={(e) => handleRemove(acc.userId, e)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    handleRemove(acc.userId, e as unknown as React.MouseEvent);
                  }
                }}
                className="rounded-full px-1.5 py-0.5 text-[11px] text-stone-400 opacity-0 transition hover:text-red-600 group-hover:opacity-100"
              >
                ×
              </span>
            )}
          </button>
        );
      })}

      {error && (
        <p role="alert" className="mx-3 mt-1 text-[11px] text-red-600">
          {error}
        </p>
      )}

      <Link
        href="/sign-in?mode=add"
        onClick={onNavigate}
        className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-stone-700 dark:text-stone-300 transition hover:bg-violet-50 dark:hover:bg-violet-900/30 hover:text-violet-800 dark:hover:text-violet-300"
      >
        <span className="text-xs">+</span>
        Add another account
      </Link>
    </div>
  );
}
