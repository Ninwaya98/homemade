"use client";

import { createClient } from "@/lib/supabase/client";

/**
 * Instagram-style multi-account switcher. Stores up to MAX_ACCOUNTS sets of
 * Supabase session tokens in localStorage so the user can switch between
 * signed-in accounts without going through the sign-in form each time.
 *
 * Security note: refresh tokens in localStorage are accessible to same-origin
 * JavaScript. This is the same posture as Supabase's default cookie storage
 * (not httpOnly under @supabase/ssr). Acceptable for this app's risk model;
 * if XSS ever occurs the attacker gets up to MAX_ACCOUNTS sessions instead
 * of one.
 */

const STORAGE_KEY = "homemade-accounts";
const MAX_ACCOUNTS = 5;

export type StoredAccount = {
  userId: string;
  email: string;
  fullName: string;
  initial: string;
  accessToken: string;
  refreshToken: string;
  savedAt: number;
};

type Bag = {
  accounts: StoredAccount[];
  activeUserId: string | null;
};

function emptyBag(): Bag {
  return { accounts: [], activeUserId: null };
}

function readBag(): Bag {
  if (typeof window === "undefined") return emptyBag();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyBag();
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.accounts)) return emptyBag();
    return parsed as Bag;
  } catch {
    return emptyBag();
  }
}

function writeBag(bag: Bag) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bag));
  } catch {
    /* quota exceeded or storage disabled — silent */
  }
}

export function getStoredAccounts(): StoredAccount[] {
  return readBag().accounts;
}

export function getActiveUserId(): string | null {
  return readBag().activeUserId;
}

/**
 * Upsert the given account into the bag and mark it active. If the bag is
 * already at capacity and the incoming account is new, the oldest (by
 * savedAt) non-active account is evicted.
 */
export function upsertAccount(account: Omit<StoredAccount, "savedAt">) {
  const bag = readBag();
  const existing = bag.accounts.findIndex((a) => a.userId === account.userId);
  const now = Date.now();
  const entry: StoredAccount = { ...account, savedAt: now };

  if (existing >= 0) {
    bag.accounts[existing] = entry;
  } else {
    if (bag.accounts.length >= MAX_ACCOUNTS) {
      // Evict the oldest non-active account; if all are active somehow, evict oldest.
      const sorted = [...bag.accounts].sort((a, b) => a.savedAt - b.savedAt);
      const victim = sorted.find((a) => a.userId !== bag.activeUserId) ?? sorted[0];
      bag.accounts = bag.accounts.filter((a) => a.userId !== victim.userId);
    }
    bag.accounts.push(entry);
  }
  bag.activeUserId = account.userId;
  writeBag(bag);
}

export function removeAccount(userId: string) {
  const bag = readBag();
  bag.accounts = bag.accounts.filter((a) => a.userId !== userId);
  if (bag.activeUserId === userId) {
    // Fall back to the most recently saved remaining account, if any.
    const next = [...bag.accounts].sort((a, b) => b.savedAt - a.savedAt)[0];
    bag.activeUserId = next?.userId ?? null;
  }
  writeBag(bag);
}

/**
 * Swap the Supabase session to the given stored account's tokens. Caller
 * should reload / navigate after this resolves so server components pick
 * up the new identity from cookies.
 *
 * If Supabase rejects the stored refresh token (expired, revoked), the
 * account is removed from the bag and the caller gets a reject.
 */
export async function switchToAccount(userId: string): Promise<void> {
  const bag = readBag();
  const target = bag.accounts.find((a) => a.userId === userId);
  if (!target) throw new Error("Account not in bag");

  const supabase = createClient();
  const { error } = await supabase.auth.setSession({
    access_token: target.accessToken,
    refresh_token: target.refreshToken,
  });
  if (error) {
    removeAccount(userId);
    throw new Error(error.message);
  }
  bag.activeUserId = userId;
  writeBag(bag);
}

/**
 * Reads the current Supabase session and, if present, upserts it into the
 * bag. Call on every signed-in page mount so the bag stays in sync with
 * whichever account the cookie currently holds.
 */
export async function syncCurrentSession(): Promise<StoredAccount | null> {
  if (typeof window === "undefined") return null;
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", session.user.id)
    .maybeSingle();

  const fullName = profile?.full_name ?? session.user.email ?? "Account";
  const initial = (fullName.trim()[0] ?? "?").toUpperCase();

  const account: Omit<StoredAccount, "savedAt"> = {
    userId: session.user.id,
    email: session.user.email ?? "",
    fullName,
    initial,
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
  };
  upsertAccount(account);
  const stored = getStoredAccounts().find((a) => a.userId === account.userId);
  return stored ?? null;
}
