"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { ALLERGENS, DEFAULT_DAILY_PORTION_CAP } from "@/lib/constants";
import type {
  AvailabilityMode,
  DishStatus,
} from "@/lib/types";

const ALLOWED_IMAGE_EXTS = new Set(["jpg", "jpeg", "png", "webp", "gif"]);
const ALLOWED_CERT_EXTS = new Set(["pdf", "jpg", "jpeg", "png", "webp"]);

function safeExt(filename: string, allowed: Set<string>, fallback: string): string {
  const raw = filename.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "";
  return allowed.has(raw) ? raw : fallback;
}

// =====================================================================
// Cook onboarding
// =====================================================================

export type OnboardingState =
  | { error?: string; ok?: boolean }
  | undefined;

export async function submitOnboarding(
  _state: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const profile = await requireRole("cook");
  const supabase = await createClient();

  const bio = String(formData.get("bio") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const cuisineRaw = String(formData.get("cuisine_tags") ?? "");
  const cuisineTags = cuisineRaw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (bio.length < 20) {
    return { error: "Tell customers a bit more about your cooking — at least 20 characters." };
  }
  if (cuisineTags.length === 0) {
    return { error: "Pick at least one cuisine tag." };
  }
  if (!phone) {
    return { error: "We need a phone number so customers can reach you about pickups." };
  }
  if (!/^[+\d\s\-()]{7,20}$/.test(phone)) {
    return { error: "Please enter a valid phone number." };
  }
  if (!location) {
    return { error: "Add a location (city or neighbourhood) so we can match you with nearby customers." };
  }

  const certFile = formData.get("certificate") as File | null;
  if (!certFile || certFile.size === 0) {
    return { error: "Upload your food handler certificate to continue." };
  }
  if (certFile.size > 10 * 1024 * 1024) {
    return { error: "Certificate is too large (max 10 MB)." };
  }

  const photoFile = formData.get("photo") as File | null;

  // Validate photo size early, before uploading anything
  if (photoFile && photoFile.size > 0 && photoFile.size > 5 * 1024 * 1024) {
    return { error: "Photo is too large (max 5 MB)." };
  }

  // 1) Update the profile row with phone + location
  {
    const { error } = await supabase
      .from("profiles")
      .update({ phone, location })
      .eq("id", profile.id);
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

export async function createDish(
  _state: DishFormState,
  formData: FormData,
): Promise<DishFormState> {
  const profile = await requireRole("cook");
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
  const priceDollars = Number(formData.get("price") ?? 0);
  const portionSize = String(formData.get("portion_size") ?? "").trim();
  const cuisineTag = String(formData.get("cuisine_tag") ?? "").trim() || null;

  if (!name) return { error: "Dish name is required." };
  if (!Number.isFinite(priceDollars) || priceDollars <= 0) {
    return { error: "Price must be greater than zero." };
  }

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

  const { error } = await supabase.from("dishes").insert({
    cook_id: profile.id,
    name,
    description: description || null,
    price_cents: Math.round(priceDollars * 100),
    portion_size: portionSize || null,
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
  const profile = await requireRole("cook");
  const supabase = await createClient();

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const priceDollars = Number(formData.get("price") ?? 0);
  const portionSize = String(formData.get("portion_size") ?? "").trim();
  const cuisineTag = String(formData.get("cuisine_tag") ?? "").trim() || null;

  if (!name) return { error: "Dish name is required." };
  if (!Number.isFinite(priceDollars) || priceDollars <= 0) {
    return { error: "Price must be greater than zero." };
  }

  const { allergens, ok } = parseAllergens(formData);
  if (!ok) {
    return {
      error: "Complete the allergen checklist before saving.",
    };
  }

  const updates: import("@/lib/types").DishUpdate = {
    name,
    description: description || null,
    price_cents: Math.round(priceDollars * 100),
    portion_size: portionSize || null,
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

  const { error } = await supabase
    .from("dishes")
    .update(updates)
    .eq("id", dishId)
    .eq("cook_id", profile.id); // belt + braces (RLS already enforces)
  if (error) return { error: `Could not save dish: ${error.message}` };

  revalidatePath("/cook/dishes");
  revalidatePath(`/cook/dishes/${dishId}`);
  redirect("/cook/dishes?updated=1");
}

export async function setDishStatus(dishId: string, status: DishStatus) {
  const profile = await requireRole("cook");
  const supabase = await createClient();
  await supabase
    .from("dishes")
    .update({ status })
    .eq("id", dishId)
    .eq("cook_id", profile.id);
  revalidatePath("/cook/dishes");
}

export async function deleteDish(dishId: string) {
  const profile = await requireRole("cook");
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

export async function saveAvailability(formData: FormData) {
  const profile = await requireRole("cook");
  const supabase = await createClient();

  const datesRaw = String(formData.get("dates") ?? "");
  const dates = datesRaw.split(",").filter(Boolean);

  const rows = dates.map((date) => {
    const isOpen = formData.get(`open_${date}`) === "on";
    const mode = String(formData.get(`mode_${date}`) ?? "preorder") as AvailabilityMode;
    const maxPortions = Math.max(
      1,
      Math.min(50, Number(formData.get(`portions_${date}`) ?? DEFAULT_DAILY_PORTION_CAP)),
    );
    return {
      cook_id: profile.id,
      date,
      mode,
      max_portions: maxPortions,
      is_open: isOpen,
    };
  });

  await supabase.from("availability").upsert(rows, { onConflict: "cook_id,date" });

  // Bump last_active_at so the admin health tracker doesn't flag them.
  await supabase
    .from("cook_profiles")
    .update({ last_active_at: new Date().toISOString() })
    .eq("id", profile.id);

  revalidatePath("/cook/schedule");
  revalidatePath("/cook");
  redirect("/cook/schedule?saved=1");
}

// =====================================================================
// Order management (cook side)
// =====================================================================

export async function setOrderStatus(
  orderId: string,
  status: "confirmed" | "ready" | "completed" | "cancelled",
  estimatedReadyTime?: string,
) {
  const profile = await requireRole("cook");
  const supabase = await createClient();

  // Allowed transitions enforced here (RLS allows the update, we shape the FSM).
  const { data: order } = await supabase
    .from("orders")
    .select("status, cook_id, quantity, scheduled_for")
    .eq("id", orderId)
    .single();
  if (!order || order.cook_id !== profile.id) {
    return;
  }
  const allowed: Record<string, string[]> = {
    pending: ["confirmed", "cancelled"],
    confirmed: ["ready", "cancelled"],
    ready: ["completed"],
    completed: [],
    cancelled: [],
  };
  if (!allowed[order.status]?.includes(status)) {
    return;
  }
  await supabase.from("orders").update({ status }).eq("id", orderId);

  // Record status timestamps + estimated ready time (columns from migration 006).
  // Uses rpc-style raw update since these columns aren't in generated types yet.
  const now = new Date().toISOString();
  const extras: Record<string, string> = {};
  if (status === "confirmed") {
    extras.confirmed_at = now;
    if (estimatedReadyTime) extras.estimated_ready_time = estimatedReadyTime;
  }
  if (status === "ready") extras.ready_at = now;
  if (status === "completed") extras.completed_at = now;
  if (status === "cancelled") extras.cancelled_at = now;
  if (Object.keys(extras).length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("orders") as any).update(extras).eq("id", orderId);
  }

  // Refund portions when cook cancels an order
  if (status === "cancelled" && order.scheduled_for) {
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
          portions_taken: Math.max(0, avail.portions_taken - order.quantity),
        })
        .eq("cook_id", profile.id)
        .eq("date", order.scheduled_for);
    }
  }

  revalidatePath("/cook/orders");
  revalidatePath(`/cook/orders/${orderId}`);
}
