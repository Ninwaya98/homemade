// =====================================================================
// Authentic Kitchen — shared constants
// =====================================================================

// The 7 allergens from the build brief. Mandatory checklist on every dish.
export const ALLERGENS = [
  { id: "peanuts",    label: "Peanuts" },
  { id: "tree_nuts",  label: "Tree nuts" },
  { id: "gluten",     label: "Gluten" },
  { id: "dairy",      label: "Dairy" },
  { id: "shellfish",  label: "Shellfish" },
  { id: "eggs",       label: "Eggs" },
  { id: "soy",        label: "Soy" },
] as const;

export type AllergenId = (typeof ALLERGENS)[number]["id"];

export function allergenLabel(id: string): string {
  return ALLERGENS.find((a) => a.id === id)?.label ?? id;
}

// Cuisines we surface as suggestions during cook onboarding and as filter pills.
// Cooks can also type free-form tags.
export const CUISINES = [
  "Iraqi",
  "Levantine",
  "Persian",
  "Turkish",
  "Indian",
  "Pakistani",
  "Chinese",
  "Thai",
  "Japanese",
  "Italian",
  "Mexican",
  "Mediterranean",
  "Vegan",
  "BBQ",
  "Bakery",
  "Desserts",
] as const;

// Dietary filters surfaced on the customer feed. Maps to dish.cuisine_tag /
// allergens absence rather than a separate column for now.
export const DIETARY_FILTERS = [
  { id: "vegetarian",  label: "Vegetarian" },
  { id: "vegan",       label: "Vegan" },
  { id: "halal",       label: "Halal" },
  { id: "gluten_free", label: "Gluten-free" },
] as const;

// Platform commission. Brief says 15-18% — start at 16% as a sane default.
export const PLATFORM_COMMISSION_RATE = 0.16;

// Default daily portion cap for new (un-grown) cooks.
export const DEFAULT_DAILY_PORTION_CAP = 6;

// Pre-order cutoff: orders for "next day" pre-order close 24h before midnight.
export const PREORDER_CUTOFF_HOURS = 24;

// Inactive flag: cook with no orders OR no schedule for this many days
// gets auto-flagged in admin dashboard.
export const INACTIVE_THRESHOLD_DAYS = 14;

// Money helper. Stored as cents (integer) in DB; this formats for display.
export function formatPrice(cents: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

// Compute commission and cook payout from a gross total in cents.
export function splitOrderTotal(grossCents: number) {
  const commission = Math.round(grossCents * PLATFORM_COMMISSION_RATE);
  const payout = grossCents - commission;
  return { commission, payout };
}

// ISO date helpers used by the availability system.
export function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function todayIso(): string {
  return isoDate(new Date());
}

export function nextNDays(n: number): string[] {
  const out: string[] = [];
  const base = new Date();
  base.setHours(0, 0, 0, 0);
  for (let i = 0; i < n; i++) {
    const d = new Date(base);
    d.setDate(d.getDate() + i);
    out.push(isoDate(d));
  }
  return out;
}

export function dayLabel(iso: string): string {
  const d = new Date(iso + "T12:00:00Z");
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}
