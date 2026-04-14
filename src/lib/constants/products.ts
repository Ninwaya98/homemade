// =====================================================================
// HomeMade — product & cuisine constants
// =====================================================================

// Product categories for the HomeMade Market vertical.
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
// TODO: unused in frontend — for future use
export const DIETARY_FILTERS = [
  { id: "vegetarian",  label: "Vegetarian" },
  { id: "vegan",       label: "Vegan" },
  { id: "halal",       label: "Halal" },
  { id: "gluten_free", label: "Gluten-free" },
] as const;
