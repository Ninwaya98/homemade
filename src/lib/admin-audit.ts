import "server-only";

import { createClient } from "@/lib/supabase/server";

/**
 * Append an entry to admin_audit_log. Callers must have already run
 * requireRole("admin") — this helper trusts its inputs and does not
 * re-check auth. Failures are swallowed (logged to stderr) so a
 * transient audit-log outage never blocks the real admin operation.
 */
export type AdminAuditEntry = {
  adminId: string;
  action: string;
  targetTable: string;
  targetId?: string | null;
  targetSellerId?: string | null;
  oldValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
  notes?: string | null;
};

export async function logAdminAction(entry: AdminAuditEntry): Promise<void> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createClient()) as any;
    const { error } = await supabase.from("admin_audit_log").insert({
      admin_id: entry.adminId,
      action: entry.action,
      target_table: entry.targetTable,
      target_id: entry.targetId ?? null,
      target_seller_id: entry.targetSellerId ?? null,
      old_values: entry.oldValues ?? null,
      new_values: entry.newValues ?? null,
      notes: entry.notes ?? null,
    });
    if (error) {
      // Log but don't throw — audit write failure shouldn't fail the
      // actual admin action.
      console.error("[admin-audit] failed to write log entry", {
        action: entry.action,
        error: error.message,
      });
    }
  } catch (e) {
    console.error("[admin-audit] unexpected error", e);
  }
}
