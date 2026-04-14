// =====================================================================
// HomeMade — allergen constants
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
