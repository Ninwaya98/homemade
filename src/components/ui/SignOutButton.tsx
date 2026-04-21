"use client";

import { useTransition } from "react";
import { signOut } from "@/app/actions/auth";
import {
  getActiveUserId,
  getStoredAccounts,
  removeAccount,
  switchToAccount,
} from "@/lib/account-switcher";

/**
 * Smart sign-out: removes the active account from the local bag first so
 * switching away doesn't silently leave the old refresh token behind. If
 * another account is bagged, switches into it instead of a full sign-out
 * (Instagram behaviour: logging out of one account doesn't dump the
 * others).
 */
export function SignOutButton() {
  const [pending, start] = useTransition();

  function handleClick() {
    start(async () => {
      const activeId = getActiveUserId();
      const others = getStoredAccounts().filter((a) => a.userId !== activeId);

      if (activeId) removeAccount(activeId);

      if (others.length > 0) {
        // Switch into the most recently saved remaining account.
        const next = [...others].sort((a, b) => b.savedAt - a.savedAt)[0];
        try {
          await switchToAccount(next.userId);
          window.location.href = "/customer";
          return;
        } catch {
          // If the remaining account's refresh token is dead, fall through
          // to a full sign-out below.
        }
      }

      await signOut();
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-stone-600 dark:text-stone-400 transition hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 dark:hover:text-red-400 disabled:opacity-60"
    >
      <span className="text-xs">↩</span>
      {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}
