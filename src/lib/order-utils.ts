// =====================================================================
// HomeMade — shared order utilities
// =====================================================================
// Used by both cook/actions.ts and seller/actions.ts to avoid
// duplicating the order state machine and timestamp logic.

/**
 * Allowed order status transitions (FSM).
 * Both kitchen and market orders follow the same lifecycle.
 */
export const ORDER_TRANSITIONS: Record<string, string[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["ready", "cancelled"],
  ready: ["completed"],
  completed: [],
  cancelled: [],
};

/**
 * Check if a status transition is allowed.
 */
export function isTransitionAllowed(
  currentStatus: string,
  nextStatus: string,
): boolean {
  return ORDER_TRANSITIONS[currentStatus]?.includes(nextStatus) ?? false;
}

/**
 * Build the extra fields (timestamps + estimated ready time) to
 * write alongside a status update. These columns come from migration
 * 006 and aren't in the generated Supabase types yet.
 */
export function buildStatusExtras(
  status: string,
  estimatedReadyTime?: string,
): Record<string, string> {
  const now = new Date().toISOString();
  const extras: Record<string, string> = {};
  if (status === "confirmed") {
    extras.confirmed_at = now;
    if (estimatedReadyTime) extras.estimated_ready_time = estimatedReadyTime;
  }
  if (status === "ready") extras.ready_at = now;
  if (status === "completed") extras.completed_at = now;
  if (status === "cancelled") extras.cancelled_at = now;
  return extras;
}
