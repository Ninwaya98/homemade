"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getAddresses() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from("delivery_addresses")
    .select("*")
    .eq("user_id", user.id)
    .order("is_default", { ascending: false });
  return data ?? [];
}

export async function addAddress(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const label = (formData.get("label") as string)?.trim() || "Home";
  const address_line = (formData.get("address_line") as string)?.trim();
  const city = (formData.get("city") as string)?.trim() || null;
  const notes = (formData.get("notes") as string)?.trim() || null;
  const is_default = formData.get("is_default") === "true";

  if (!address_line) return { error: "Address is required" };
  if (label.length > 100) return { error: "Label is too long (max 100 characters)" };
  if (address_line.length > 500) return { error: "Address is too long (max 500 characters)" };
  if (city && city.length > 200) return { error: "City is too long (max 200 characters)" };
  if (notes && notes.length > 500) return { error: "Notes are too long (max 500 characters)" };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("delivery_addresses")
    .insert({ user_id: user.id, label, address_line, city, notes, is_default });

  if (error) return { error: error.message };
  revalidatePath("/account/addresses");
  revalidatePath("/customer/basket");
  return { success: true };
}

export async function updateAddress(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const id = formData.get("id") as string;
  const label = (formData.get("label") as string)?.trim() || "Home";
  const address_line = (formData.get("address_line") as string)?.trim();
  const city = (formData.get("city") as string)?.trim() || null;
  const notes = (formData.get("notes") as string)?.trim() || null;
  const is_default = formData.get("is_default") === "true";

  if (!address_line) return { error: "Address is required" };
  if (label.length > 100) return { error: "Label is too long (max 100 characters)" };
  if (address_line.length > 500) return { error: "Address is too long (max 500 characters)" };
  if (city && city.length > 200) return { error: "City is too long (max 200 characters)" };
  if (notes && notes.length > 500) return { error: "Notes are too long (max 500 characters)" };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("delivery_addresses")
    .update({ label, address_line, city, notes, is_default, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/account/addresses");
  revalidatePath("/customer/basket");
  return { success: true };
}

export async function deleteAddress(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const id = formData.get("id") as string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("delivery_addresses")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/account/addresses");
  return { success: true };
}
