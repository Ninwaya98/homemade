"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { adminSellerUpdateSchema } from "@/lib/schemas";

export type AdminActionResult = { error?: string } | undefined;

// =====================================================================
// Seller management
// =====================================================================

export async function approveSeller(sellerId: string): Promise<AdminActionResult> {
  const me = await requireRole("admin");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any;
  const { error } = await supabase
    .from("seller_profiles")
    .update({
      status: "approved",
      approved_at: new Date().toISOString(),
      approved_by: me.id,
    })
    .eq("id", sellerId);
  if (error) return { error: `Failed to approve seller: ${error.message}` };
  revalidatePath("/admin/sellers");
  revalidatePath("/admin/sellers/all");
}

export async function rejectSeller(sellerId: string): Promise<AdminActionResult> {
  const me = await requireRole("admin");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any;
  const { error } = await supabase
    .from("seller_profiles")
    .update({
      status: "suspended",
      approved_at: null,
      approved_by: me.id,
    })
    .eq("id", sellerId);
  if (error) return { error: `Failed to reject seller: ${error.message}` };
  revalidatePath("/admin/sellers");
  revalidatePath("/admin/sellers/all");
}

export async function reinstateSeller(sellerId: string): Promise<AdminActionResult> {
  const me = await requireRole("admin");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any;
  const { error } = await supabase
    .from("seller_profiles")
    .update({
      status: "approved",
      approved_at: new Date().toISOString(),
      approved_by: me.id,
    })
    .eq("id", sellerId);
  if (error) return { error: `Failed to reinstate seller: ${error.message}` };
  revalidatePath("/admin/sellers/all");
}

export type AdminSellerUpdateState =
  | { error?: string; success?: boolean; fields?: Record<string, string> }
  | undefined;

/**
 * Admin-side edit of any seller's profile (shop_name, description,
 * category, phone, location). RLS already allows admins to UPDATE
 * seller_profiles and profiles. Phone and location live on profiles
 * (seller owner's contact info), everything else on seller_profiles.
 */
export async function updateSellerProfile(
  sellerId: string,
  _state: AdminSellerUpdateState,
  formData: FormData,
): Promise<AdminSellerUpdateState> {
  await requireRole("admin");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any;

  const rawShopName = String(formData.get("shop_name") ?? "").trim();
  const rawShopDescription = String(formData.get("shop_description") ?? "").trim();
  const rawCategory = String(formData.get("category") ?? "").trim();
  const rawPhone = String(formData.get("phone") ?? "").trim();
  const rawLocation = String(formData.get("location") ?? "").trim();

  const parsed = adminSellerUpdateSchema.safeParse({
    shop_name: rawShopName || undefined,
    shop_description: rawShopDescription || undefined,
    category: rawCategory || undefined,
    phone: rawPhone || undefined,
    location: rawLocation || undefined,
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
      fields: {
        shop_name: rawShopName,
        shop_description: rawShopDescription,
        category: rawCategory,
        phone: rawPhone,
        location: rawLocation,
      },
    };
  }

  const sellerPatch: Record<string, string> = {};
  if (parsed.data.shop_name) sellerPatch.shop_name = parsed.data.shop_name;
  if (parsed.data.shop_description) sellerPatch.shop_description = parsed.data.shop_description;
  if (parsed.data.category) sellerPatch.category = parsed.data.category;

  const profilePatch: Record<string, string> = {};
  if (parsed.data.phone) profilePatch.phone = parsed.data.phone;
  if (parsed.data.location) profilePatch.location = parsed.data.location;

  if (Object.keys(sellerPatch).length > 0) {
    const { error } = await supabase
      .from("seller_profiles")
      .update(sellerPatch)
      .eq("id", sellerId);
    if (error) return { error: `Failed to update shop: ${error.message}` };
  }

  if (Object.keys(profilePatch).length > 0) {
    const { error } = await supabase
      .from("profiles")
      .update(profilePatch)
      .eq("id", sellerId);
    if (error) return { error: `Failed to update contact info: ${error.message}` };
  }

  revalidatePath(`/admin/sellers/${sellerId}`);
  revalidatePath("/admin/sellers/all");
  return { success: true };
}

// ── Review moderation ───────────────────────────────────────────────

export async function approveResolution(reviewId: string) {
  const admin = await requireRole("admin");
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;

  const { data: review } = await sb
    .from("reviews")
    .select("reviewee_id, resolution_status")
    .eq("id", reviewId)
    .single();
  if (!review || review.resolution_status !== "pending") return;

  await sb.from("reviews").update({
    resolution_status: "approved",
    resolved_at: new Date().toISOString(),
    resolved_by: admin.id,
  }).eq("id", reviewId);

  // Score recalculation handled by database trigger (migration 015)

  revalidatePath("/admin/reviews");
}

export async function rejectResolution(reviewId: string) {
  const admin = await requireRole("admin");
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).from("reviews").update({
    resolution_status: "rejected",
    resolved_at: new Date().toISOString(),
    resolved_by: admin.id,
  }).eq("id", reviewId);

  revalidatePath("/admin/reviews");
}

/**
 * Generate a short-lived signed URL for an admin to view a cook's
 * food handler certificate. The certificates bucket is private; only
 * admins and the owning cook can read.
 */
export async function getCertificateSignedUrl(certPath: string): Promise<string | null> {
  await requireRole("admin");
  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from("certificates")
    .createSignedUrl(certPath, 60 * 5); // 5 minutes
  if (error) return null;
  return data.signedUrl;
}
