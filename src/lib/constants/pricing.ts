// =====================================================================
// HomeMade — pricing & platform constants
// =====================================================================

// Platform commission. Brief says 15-18% — start at 16% as a sane default.
export const PLATFORM_COMMISSION_RATE = 0.16; // Used internally by splitOrderTotal

// Money helper. Stored as cents (integer) in DB; this formats for display.
export function formatPrice(cents: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

// Returns the minimum price from a dish's portion_sizes for "from $X" display.
// Falls back to the legacy price_cents if no portion_sizes.
export function minPriceCents(
  priceCents: number,
  portionSizes: Record<string, { price_cents: number }> | null | undefined,
): number {
  if (!portionSizes) return priceCents;
  const prices = Object.values(portionSizes).map((s) => s.price_cents);
  return prices.length > 0 ? Math.min(...prices) : priceCents;
}

// Compute commission and cook payout from a gross total in cents.
export function splitOrderTotal(grossCents: number) {
  const commission = Math.round(grossCents * PLATFORM_COMMISSION_RATE);
  const payout = grossCents - commission;
  return { commission, payout };
}

// Pre-order cutoff: orders for "next day" pre-order close 24h before midnight.
export const PREORDER_CUTOFF_HOURS = 24; // TODO: unused in frontend — for future use

// Inactive flag: cook with no orders OR no schedule for this many days
// gets auto-flagged in admin dashboard.
export const INACTIVE_THRESHOLD_DAYS = 14; // TODO: unused in frontend — for future use
