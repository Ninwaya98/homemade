"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { requireAuth, requireCookProfile } from "@/lib/auth";
import { ALLERGENS, DEFAULT_DAILY_PORTION_CAP, PORTION_SIZES, portionSizePortions } from "@/lib/constants";
import { isTransitionAllowed, buildStatusExtras } from "@/lib/order-utils";
import type {
  AvailabilityMode,
  DishStatus,
  DishPortionSizes,
  PortionSizeConfig,
} from "@/lib/types";

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const ALLOWED_CERT_TYPES = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);
const ALLOWED_IMAGE_EXTS = new Set(["jpg", "jpeg", "png", "webp", "gif"]);
const ALLOWED_CERT_EXTS = new Set(["pdf", "jpg", "jpeg", "png", "webp"]);

function safeExt(filename: string, allowed: Set<string>, fallback: string): string {
  const raw = filename.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "";
  return allowed.has(raw) ? raw : fallback;
}

function validateFileType(file: File, allowedTypes: Set<string>): boolean {
  return allowedTypes.has(file.type);
}

// =====================================================================
// Cook onboarding
// =====================================================================

export type OnboardingState =
  | {
      error?: string;
      ok?: boolean;
      fields?: {
        bio?: string;
        cuisine_tags?: string;
        phone?: string;
        location?: string;
      };
    }
  | undefined;

export async function submitOnboarding(
  _state: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const profile = await requireAuth();
  const supabase = await createClient();

  const bio = String(formData.get("bio") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const cuisineRaw = String(formData.get("cuisine_tags") ?? "");
  const cuisineTags = cuisineRaw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  // Preserve field values on error so the form doesn't clear
  const fields = { bio, cuisine_tags: cuisineRaw, phone, location };

  if (bio.length < 20) {
    return { error: "Tell customers a bit more about your cooking — at least 20 characters.", fields };
  }
  if (cuisineTags.length === 0) {
    return { error: "Pick at least one cuisine tag.", fields };
  }
  if (!phone) {
    return { error: "We need a phone number so customers can reach you about pickups.", fields };
  }
  if (!/^[+\d\s\-()]{7,20}$/.test(phone)) {
    return { error: "Please enter a valid phone number.", fields };
  }
  if (!location) {
    return { error: "Add a location (city or neighbourhood) so we can match you with nearby customers.", fields };
  }

  const certFile = formData.get("certificate") as File | null;
  if (!certFile || certFile.size === 0) {
    return { error: "Upload your food handler certificate to continue.", fields };
  }
  if (certFile.size > 10 * 1024 * 1024) {
    return { error: "Certificate is too large (max 10 MB).", fields };
  }
  if (!validateFileType(certFile, ALLOWED_CERT_TYPES)) {
    return { error: "Certificate must be a PDF, JPG, PNG, or WebP file.", fields };
  }

  const photoFile = formData.get("photo") as File | null;

  // Validate photo size and type early, before uploading anything
  if (photoFile && photoFile.size > 0 && photoFile.size > 5 * 1024 * 1024) {
    return { error: "Photo is too large (max 5 MB).", fields };
  }
  if (photoFile && photoFile.size > 0 && !validateFileType(photoFile, ALLOWED_IMAGE_TYPES)) {
    return { error: "Photo must be a JPG, PNG, WebP, or GIF image.", fields };
  }

  // 1) Update the profile row with phone + location (via RPC to bypass RLS recursion)
  {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).rpc("update_own_profile", {
      p_phone: phone,
      p_location: location,
    });
    if (error) return { error: `Could not save profile: ${error.message}` };
  }

  // 2) Upload certificate (private bucket, path = <user_id>/cert_<ts>.<ext>)
  let certPath: string;
  {
    const ext = safeExt(certFile.name, ALLOWED_CERT_EXTS, "pdf");
    certPath = `${profile.id}/cert_${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("certificates")
      .upload(certPath, certFile, {
        contentType: certFile.type || "application/octet-stream",
        upsert: true,
      });
    if (error) return { error: `Could not upload certificate: ${error.message}` };
  }

  // 3) Optional: upload cook photo (public bucket — size already validated above)
  let photoPath: string | null = null;
  if (photoFile && photoFile.size > 0) {
    const ext = safeExt(photoFile.name, ALLOWED_IMAGE_EXTS, "jpg");
    photoPath = `${profile.id}/avatar_${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("cook-photos")
      .upload(photoPath, photoFile, {
        contentType: photoFile.type || "image/jpeg",
        upsert: true,
      });
    if (error) return { error: `Could not upload photo: ${error.message}` };
  }

  // Photo URL: public bucket → constructable, but we use the helper.
  let photoPublicUrl: string | null = null;
  if (photoPath) {
    const { data } = supabase.storage.from("cook-photos").getPublicUrl(photoPath);
    photoPublicUrl = data.publicUrl;
  }

  // 4) Upsert the cook_profile row (status stays/becomes pending)
  {
    const { error } = await supabase.from("cook_profiles").upsert(
      {
        id: profile.id,
        bio,
        cuisine_tags: cuisineTags,
        certification_url: certPath, // store path; admin uses signed URL
        photo_url: photoPublicUrl,
        status: "pending",
      },
      { onConflict: "id" },
    );
    if (error) return { error: `Could not save cook profile: ${error.message}` };
  }

  revalidatePath("/cook", "layout");
  redirect("/cook?onboarded=1");
}

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

  if (!name) return { error: "Dish name is required." };

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
    const ext = safeExt(photoFile.name, ALLOWED_IMAGE_EXTS, "jpg");
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

  if (!name) return { error: "Dish name is required." };

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
    const ext = safeExt(photoFile.name, ALLOWED_IMAGE_EXTS, "jpg");
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

// =====================================================================
// Availability (weekly schedule)
// =====================================================================

// Save weekly schedule template (Mon-Sun recurring).
export async function saveWeeklySchedule(formData: FormData) {
  const { profile } = await requireCookProfile();
  const supabase = await createClient();

  // Build the weekly_schedule JSONB from form data (keys 0-6 = Sun-Sat)
  const schedule: Record<string, { is_open: boolean; mode: string; max_portions: number }> = {};
  for (let dow = 0; dow <= 6; dow++) {
    const key = String(dow);
    const isOpen = formData.get(`open_${key}`) === "on";
    const mode = String(formData.get(`mode_${key}`) ?? "preorder");
    const maxPortions = Math.max(
      1,
      Math.min(50, Number(formData.get(`portions_${key}`) ?? DEFAULT_DAILY_PORTION_CAP)),
    );
    schedule[key] = { is_open: isOpen, mode, max_portions: maxPortions };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("cook_profiles") as any)
    .update({
      weekly_schedule: schedule,
      last_active_at: new Date().toISOString(),
    })
    .eq("id", profile.id);

  if (error) {
    // Can't return from a form action that redirects, so just log
    console.error("Failed to save weekly schedule:", error.message);
  }

  revalidatePath("/cook/schedule");
  revalidatePath("/cook");
  redirect("/cook/schedule?saved=1");
}

// Toggle cook availability on/off (quick "not available" mode).
export async function toggleAvailability() {
  const { profile } = await requireCookProfile();
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: cp, error: fetchError } = await (supabase.from("cook_profiles") as any)
    .select("is_available")
    .eq("id", profile.id)
    .single();

  if (fetchError || !cp) return;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("cook_profiles") as any)
    .update({ is_available: !(cp.is_available ?? true) })
    .eq("id", profile.id);

  if (error) {
    console.error("Failed to toggle availability:", error.message);
  }

  revalidatePath("/cook");
  revalidatePath("/cook/schedule");
}

// =====================================================================
// Order management (cook side)
// =====================================================================

export async function setOrderStatus(
  orderId: string,
  status: "confirmed" | "ready" | "completed" | "cancelled",
  estimatedReadyTime?: string,
) {
  const { profile } = await requireCookProfile();
  const supabase = await createClient();

  // Allowed transitions enforced here (RLS allows the update, we shape the FSM).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: order } = await (supabase.from("orders") as any)
    .select("status, cook_id, quantity, scheduled_for, portion_size")
    .eq("id", orderId)
    .single();
  if (!order || order.cook_id !== profile.id) {
    return;
  }
  if (!isTransitionAllowed(order.status, status)) return;

  await supabase.from("orders").update({ status }).eq("id", orderId);

  const extras = buildStatusExtras(status, estimatedReadyTime);
  if (Object.keys(extras).length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("orders") as any).update(extras).eq("id", orderId);
  }

  // Refund portions when cook cancels an order (portion-size aware)
  if (status === "cancelled" && order.scheduled_for) {
    const portionsPerUnit = portionSizePortions(order.portion_size ?? "");
    const totalPortions = order.quantity * portionsPerUnit;
    const { data: avail } = await supabase
      .from("availability")
      .select("portions_taken")
      .eq("cook_id", profile.id)
      .eq("date", order.scheduled_for)
      .single();
    if (avail) {
      await supabase
        .from("availability")
        .update({
          portions_taken: Math.max(0, avail.portions_taken - totalPortions),
        })
        .eq("cook_id", profile.id)
        .eq("date", order.scheduled_for);
    }
  }

  revalidatePath("/cook/orders");
  revalidatePath(`/cook/orders/${orderId}`);
}
