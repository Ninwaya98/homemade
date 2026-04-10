"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";

export async function approveCook(cookId: string) {
  const me = await requireRole("admin");
  const supabase = await createClient();
  await supabase
    .from("cook_profiles")
    .update({
      status: "approved",
      approved_at: new Date().toISOString(),
      approved_by: me.id,
    })
    .eq("id", cookId);
  revalidatePath("/admin");
  revalidatePath("/admin/cooks");
}

export async function rejectCook(cookId: string) {
  const me = await requireRole("admin");
  const supabase = await createClient();
  await supabase
    .from("cook_profiles")
    .update({
      status: "suspended",
      approved_at: null,
      approved_by: me.id,
    })
    .eq("id", cookId);
  revalidatePath("/admin");
  revalidatePath("/admin/cooks");
}

export async function reinstateCook(cookId: string) {
  const me = await requireRole("admin");
  const supabase = await createClient();
  await supabase
    .from("cook_profiles")
    .update({
      status: "approved",
      approved_at: new Date().toISOString(),
      approved_by: me.id,
    })
    .eq("id", cookId);
  revalidatePath("/admin/cooks");
}

/**
 * Generate a short-lived signed URL for an admin to view a cook's
 * food handler certificate. The certificates bucket is private; only
 * admins and the owning cook can read.
 */
// =====================================================================
// Seller management
// =====================================================================

export async function approveSeller(sellerId: string) {
  const me = await requireRole("admin");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any;
  await supabase
    .from("seller_profiles")
    .update({
      status: "approved",
      approved_at: new Date().toISOString(),
      approved_by: me.id,
    })
    .eq("id", sellerId);
  revalidatePath("/admin/sellers");
  revalidatePath("/admin/sellers/all");
}

export async function rejectSeller(sellerId: string) {
  const me = await requireRole("admin");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any;
  await supabase
    .from("seller_profiles")
    .update({
      status: "suspended",
      approved_at: null,
      approved_by: me.id,
    })
    .eq("id", sellerId);
  revalidatePath("/admin/sellers");
  revalidatePath("/admin/sellers/all");
}

export async function reinstateSeller(sellerId: string) {
  const me = await requireRole("admin");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any;
  await supabase
    .from("seller_profiles")
    .update({
      status: "approved",
      approved_at: new Date().toISOString(),
      approved_by: me.id,
    })
    .eq("id", sellerId);
  revalidatePath("/admin/sellers/all");
}

export async function getCertificateSignedUrl(certPath: string): Promise<string | null> {
  await requireRole("admin");
  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from("certificates")
    .createSignedUrl(certPath, 60 * 5); // 5 minutes
  if (error) return null;
  return data.signedUrl;
}
