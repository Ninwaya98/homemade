// =====================================================================
// HomeMade — portion size constants
// =====================================================================

// Portion sizes for dishes. Each size consumes a different number of
// availability portions: Small = 1, Medium = 2, Large = 3.
export const PORTION_SIZES = [
  { id: "small",  label: "Small",  servesLabel: "serves ~1 person",  portions: 1 },
  { id: "medium", label: "Medium", servesLabel: "serves ~2 people", portions: 2 },
  { id: "large",  label: "Large",  servesLabel: "serves ~3 people", portions: 3 },
] as const;

export type PortionSizeId = (typeof PORTION_SIZES)[number]["id"];

export function portionSizeLabel(id: string): string {
  return PORTION_SIZES.find((s) => s.id === id)?.label ?? id;
}

export function portionSizePortions(id: string): number {
  return PORTION_SIZES.find((s) => s.id === id)?.portions ?? 1;
}

// Default daily portion cap for new (un-grown) cooks.
export const DEFAULT_DAILY_PORTION_CAP = 6;
