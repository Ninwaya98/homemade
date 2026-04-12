import type { Database } from "@/lib/database.types";

// Row-type aliases for the public schema. database.types.ts is
// regenerated from `npx supabase gen types typescript --linked` so we
// keep convenience names here instead of editing the generated file.

type PublicTables = Database["public"]["Tables"];
type PublicEnums = Database["public"]["Enums"];

export type Profile = PublicTables["profiles"]["Row"];
export type ProfileInsert = PublicTables["profiles"]["Insert"];
export type ProfileUpdate = PublicTables["profiles"]["Update"];

export type CookProfile = PublicTables["cook_profiles"]["Row"];
export type CookProfileInsert = PublicTables["cook_profiles"]["Insert"];
export type CookProfileUpdate = PublicTables["cook_profiles"]["Update"];

export type Dish = PublicTables["dishes"]["Row"];
export type DishInsert = PublicTables["dishes"]["Insert"];
export type DishUpdate = PublicTables["dishes"]["Update"];

export type Availability = PublicTables["availability"]["Row"];
export type AvailabilityInsert = PublicTables["availability"]["Insert"];
export type AvailabilityUpdate = PublicTables["availability"]["Update"];

export type Order = PublicTables["orders"]["Row"];
export type OrderInsert = PublicTables["orders"]["Insert"];
export type OrderUpdate = PublicTables["orders"]["Update"];

export type Review = PublicTables["reviews"]["Row"];
export type ReviewInsert = PublicTables["reviews"]["Insert"];

export type Payout = PublicTables["payouts"]["Row"];

export type UserRole = PublicEnums["user_role"];
export type CookStatus = PublicEnums["cook_status"];
export type DishStatus = PublicEnums["dish_status"];
export type AvailabilityMode = PublicEnums["availability_mode"];
export type OrderType = PublicEnums["order_type"];
export type OrderStatus = PublicEnums["order_status"];

// Weekly schedule template stored in cook_profiles.weekly_schedule JSONB
// Keys are day-of-week: "0"=Sunday, "1"=Monday, ..., "6"=Saturday
export type WeeklyDayConfig = {
  is_open: boolean;
  mode: "preorder" | "on_demand";
  max_portions: number;
};
export type WeeklySchedule = Partial<Record<"0" | "1" | "2" | "3" | "4" | "5" | "6", WeeklyDayConfig>>;

// Seller types (tables from migration 007 — until types are regenerated, define manually)
export type SellerStatus = "pending" | "approved" | "suspended";
export type ProductStatus = "active" | "paused" | "out_of_stock";
export type ProductCategory = "crafts_art" | "clothing_accessories" | "home_decor" | "food_products";
export type OrderVertical = "kitchen" | "market";

export type SellerProfile = {
  id: string;
  shop_name: string;
  shop_description: string | null;
  category: ProductCategory;
  photo_url: string | null;
  status: SellerStatus;
  avg_rating: number;
  rating_count: number;
  approved_at: string | null;
  approved_by: string | null;
  last_active_at: string;
  created_at: string;
};

export type Product = {
  id: string;
  seller_id: string;
  name: string;
  description: string | null;
  category: ProductCategory;
  subcategory: string | null;
  price_cents: number;
  stock_quantity: number;
  materials: string | null;
  dimensions: string | null;
  condition: string;
  photo_urls: string[];
  ingredients: string | null;
  status: ProductStatus;
  created_at: string;
  updated_at: string;
};

// Portion size config stored in dishes.portion_sizes JSONB
export type PortionSizeConfig = {
  price_cents: number;
  label: string;
  portions: number;
};

export type DishPortionSizes = Partial<
  Record<"small" | "medium" | "large", PortionSizeConfig>
>;

// Basket item for client-side cart (localStorage)
export type BasketItem = {
  id: string;
  dishId: string;
  dishName: string;
  cookId: string;
  cookName: string;
  photoUrl: string | null;
  portionSize: "small" | "medium" | "large" | null;
  portionLabel: string | null;
  priceCents: number;
  portions: number;
  quantity: number;
  scheduledFor: string;
  allergens: string[];
};

// Joined / projected views used by feature pages
export type CookProfileWithProfile = CookProfile & { profiles: Profile };
export type DishWithCook = Dish & { cook_profiles: CookProfileWithProfile };
export type SellerProfileWithProfile = SellerProfile & { profiles: Profile };
