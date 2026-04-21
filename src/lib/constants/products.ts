// =====================================================================
// HomeMade — product constants
// =====================================================================

// Product categories for HomeMade Art.
export const PRODUCT_CATEGORIES = [
  { id: "crafts_art",             label: "Crafts & Art" },
  { id: "clothing_accessories",   label: "Clothing & Accessories" },
  { id: "home_decor",             label: "Home & Decor" },
  { id: "food_products",          label: "Food Products" },
] as const;

export type ProductCategoryId = (typeof PRODUCT_CATEGORIES)[number]["id"];

export function productCategoryLabel(id: string): string {
  return PRODUCT_CATEGORIES.find((c) => c.id === id)?.label ?? id;
}

// Product conditions.
export const PRODUCT_CONDITIONS = [
  { id: "handmade", label: "Handmade" },
  { id: "new",      label: "New" },
] as const;
