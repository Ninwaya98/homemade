"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { requireCookProfile } from "@/lib/auth";
import { ALLERGENS, PORTION_SIZES } from "@/lib/constants";
import { ALLOWED_IMAGE_TYPES, safeImageExt, validateFileType } from "@/lib/file-validation";
import { dishSchema } from "@/lib/schemas";
import type {
  DishStatus,
  DishPortionSizes,
  PortionSizeConfig,
} from "@/lib/types";

// =====================================================================
// Dish CRUD
// =====================================================================

export type DishFormState = { error?: string } | undefined;

function parseAllergens(formData: FormData): {
  allergens: string[];
  ok: boolean;
} {
  const raw = String(formData.get("allergens") ?? "");
  const allergens = raw.split(",").map((s) => s.trim()).filter(Boolean);
  const validIds = new Set(ALLERGENS.map((a) => a.id as string));
  const filtered = allergens.filter((a) => validIds.has(a));
  const confirmedNone =
    String(formData.get("allergens_confirmed_none") ?? "0") === "1";
  return { allergens: filtered, ok: filtered.length > 0 || confirmedNone };
}

function parsePortionSizes(formData: FormData): {
  portionSizes: DishPortionSizes | null;
  minPrice: number;
  error?: string;
} {
  const result: DishPortionSizes = {};
  let minPrice = Infinity;

  for (const size of PORTION_SIZES) {
    const raw = String(formData.get(`price_${size.id}`) ?? "").trim();
    if (!raw) continue;
    const dollars = Number(raw);
    if (!Number.isFinite(dollars) || dollars <= 0) {
      return { portionSizes: null, minPrice: 0, error: `${size.label} price must be greater than zero.` };
    }
    const cents = Math.round(dollars * 100);
    result[size.id as keyof DishPortionSizes] = {
      price_cents: cents,
      label: size.label,
      portions: size.portions,
    } satisfies PortionSizeConfig;
    if (cents < minPrice) minPrice = cents;
  }

  if (Object.keys(result).length === 0) {
    return { portionSizes: null, minPrice: 0, error: "Set a price for at least one portion size." };
  }

  return { portionSizes: result, minPrice };
}

export async function createDish(
  _state: DishFormState,
  formData: FormData,
): Promise<DishFormState> {
  const { profile } = await requireCookProfile();
  const supabase = await createClient();

  // Cook must be approved before they can create dishes.
  const { data: cookProfile } = await supabase
    .from("cook_profiles")
    .select("status")
    .eq("id", profile.id)
    .single();
  if (!cookProfile || cookProfile.status !== "approved") {
    return { error: "You need to be approved before adding dishes. Hang tight — admin is reviewing." };
  }

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const cuisineTag = String(formData.get("cuisine_tag") ?? "").trim() || null;

  const parsedDish = dishSchema.safeParse({ name, description: description || undefined });
  if (!parsedDish.success) return { error: parsedDish.error.issues[0].message };

  const { portionSizes, minPrice, error: psError } = parsePortionSizes(formData);
  if (psError) return { error: psError };

  const { allergens, ok } = parseAllergens(formData);
  if (!ok) {
    return {
      error:
        "Complete the allergen checklist — pick the allergens or confirm there are none.",
    };
  }

  const photoFile = formData.get("photo") as File | null;
  let photoPublicUrl: string | null = null;
  if (photoFile && photoFile.size > 0) {
    if (photoFile.size > 5 * 1024 * 1024) {
      return { error: "Photo is too large (max 5 MB)." };
    }
    if (!validateFileType(photoFile, ALLOWED_IMAGE_TYPES)) {
      return { error: "Photo must be a JPG, PNG, WebP, or GIF image." };
    }
    const ext = safeImageExt(photoFile.name);
    const path = `${profile.id}/dish_${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("dish-photos")
      .upload(path, photoFile, {
        contentType: photoFile.type || "image/jpeg",
        upsert: true,
      });
    if (error) return { error: `Could not upload photo: ${error.message}` };
    photoPublicUrl = supabase.storage.from("dish-photos").getPublicUrl(path).data.publicUrl;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("dishes") as any).insert({
    cook_id: profile.id,
    name,
    description: description || null,
    price_cents: minPrice,
    portion_sizes: portionSizes,
    portion_size: null,
    cuisine_tag: cuisineTag,
    allergens,
    photo_url: photoPublicUrl,
    status: "active",
  });
  if (error) return { error: `Could not save dish: ${error.message}` };

  revalidatePath("/cook/dishes");
  redirect("/cook/dishes?created=1");
}

export async function updateDish(
  dishId: string,
  _state: DishFormState,
  formData: FormData,
): Promise<DishFormState> {
  const { profile } = await requireCookProfile();
  const supabase = await createClient();

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const cuisineTag = String(formData.get("cuisine_tag") ?? "").trim() || null;

  const parsedDish = dishSchema.safeParse({ name, description: description || undefined });
  if (!parsedDish.success) return { error: parsedDish.error.issues[0].message };

  const { portionSizes, minPrice, error: psError } = parsePortionSizes(formData);
  if (psError) return { error: psError };

  const { allergens, ok } = parseAllergens(formData);
  if (!ok) {
    return {
      error: "Complete the allergen checklist before saving.",
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updates: any = {
    name,
    description: description || null,
    price_cents: minPrice,
    portion_sizes: portionSizes,
    cuisine_tag: cuisineTag,
    allergens,
  };

  const photoFile = formData.get("photo") as File | null;
  if (photoFile && photoFile.size > 0) {
    const ext = safeImageExt(photoFile.name);
    const path = `${profile.id}/dish_${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("dish-photos")
      .upload(path, photoFile, {
        contentType: photoFile.type || "image/jpeg",
        upsert: true,
      });
    if (error) return { error: `Could not upload photo: ${error.message}` };
    updates.photo_url = supabase.storage.from("dish-photos").getPublicUrl(path).data.publicUrl;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("dishes") as any)
    .update(updates)
    .eq("id", dishId)
    .eq("cook_id", profile.id);
  if (error) return { error: `Could not save dish: ${error.message}` };

  revalidatePath("/cook/dishes");
  revalidatePath(`/cook/dishes/${dishId}`);
  redirect("/cook/dishes?updated=1");
}

export async function setDishStatus(dishId: string, status: DishStatus) {
  const { profile } = await requireCookProfile();
  const supabase = await createClient();
  await supabase
    .from("dishes")
    .update({ status })
    .eq("id", dishId)
    .eq("cook_id", profile.id);
  revalidatePath("/cook/dishes");
}

export async function deleteDish(dishId: string) {
  const { profile } = await requireCookProfile();
  const supabase = await createClient();

  // Don't delete if there are active orders — pause the dish instead
  const { count } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true })
    .eq("dish_id", dishId)
    .in("status", ["pending", "confirmed", "ready"]);
  if (count && count > 0) {
    await supabase
      .from("dishes")
      .update({ status: "paused" as const })
      .eq("id", dishId)
      .eq("cook_id", profile.id);
    revalidatePath("/cook/dishes");
    return;
  }

  await supabase
    .from("dishes")
    .delete()
    .eq("id", dishId)
    .eq("cook_id", profile.id);
  revalidatePath("/cook/dishes");
}
