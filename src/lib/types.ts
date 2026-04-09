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

// Joined / projected views used by feature pages
export type CookProfileWithProfile = CookProfile & { profiles: Profile };
export type DishWithCook = Dish & { cook_profiles: CookProfileWithProfile };
