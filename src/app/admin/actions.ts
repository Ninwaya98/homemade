"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";

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
