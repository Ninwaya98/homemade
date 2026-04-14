"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import type { ProductCategory } from "@/lib/types";
import { ALLOWED_IMAGE_TYPES, safeImageExt, validateFileType } from "@/lib/file-validation";

// =====================================================================
// Seller onboarding
// =====================================================================

export type OnboardingState = { error?: string; ok?: boolean } | undefined;

export async function submitSellerOnboarding(
  _state: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const profile = await requireAuth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any;

  const shopName = String(formData.get("shop_name") ?? "").trim();
  const shopDescription = String(formData.get("shop_description") ?? "").trim();
  const category = String(formData.get("category") ?? "") as ProductCategory;
  const phone = String(formData.get("phone") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();

  if (!shopName || shopName.length < 3) {
    return { error: "Shop name must be at least 3 characters." };
  }
  if (shopName.length > 200) {
    return { error: "Shop name is too long (max 200 characters)." };
  }
  if (shopDescription.length > 2000) {
    return { error: "Shop description is too long (max 2000 characters)." };
  }
  if (shopDescription.length < 20) {
    return { error: "Tell customers more about your shop — at least 20 characters." };
  }
  if (!category) {
    return { error: "Pick a primary category for your shop." };
  }
  if (!phone) {
    return { error: "We need a phone number so customers can reach you." };
  }
  if (!/^[+\d\s\-()]{7,20}$/.test(phone)) {
    return { error: "Please enter a valid phone number." };
  }
  if (!location) {
    return { error: "Add a location so we can match you with nearby customers." };
  }

  // Update profile with phone + location (via RPC to bypass RLS recursion)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: rpcError } = await (supabase as any).rpc("update_own_profile", { p_phone: phone, p_location: location });
  if (rpcError) return { error: `Could not save profile: ${rpcError.message}` };

  // Optional photo upload
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
    const path = `${profile.id}/shop_${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("product-photos")
      .upload(path, photoFile, { contentType: photoFile.type || "image/jpeg", upsert: true });
    if (error) return { error: `Could not upload photo: ${error.message}` };
    photoPublicUrl = supabase.storage.from("product-photos").getPublicUrl(path).data.publicUrl;
  }

  // Upsert seller profile
  const { error } = await supabase.from("seller_profiles").upsert(
    {
      id: profile.id,
      shop_name: shopName,
      shop_description: shopDescription,
      category,
      photo_url: photoPublicUrl,
      status: "pending",
    },
    { onConflict: "id" },
  );
  if (error) return { error: `Could not save shop profile: ${error.message}` };

  revalidatePath("/seller", "layout");
  redirect("/seller?onboarded=1");
}
