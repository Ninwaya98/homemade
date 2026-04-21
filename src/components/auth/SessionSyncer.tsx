"use client";

import { useEffect } from "react";
import { syncCurrentSession } from "@/lib/account-switcher";

/**
 * Renders nothing. On mount (and on cross-tab storage changes) reads the
 * current Supabase session and syncs it into the multi-account bag. Mount
 * this once per authenticated layout (customer, seller, admin) so any
 * sign-in flow lands in the bag automatically without touching each
 * server action.
 */
export function SessionSyncer() {
  useEffect(() => {
    // Fire and forget — errors are non-fatal (bag is just a UX convenience).
    void syncCurrentSession();
  }, []);

  return null;
}
