"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireSellerProfile } from "@/lib/auth";

// ── Review response ─────────────────────────────────────────────────

export async function respondToSellerReview(formData: FormData) {
  const { sellerProfile: seller } = await requireSellerProfile();
  const supabase = await createClient();

  const reviewId = String(formData.get("review_id") ?? "");
  const responseText = String(formData.get("response_text") ?? "").trim();
  if (!reviewId || !responseText) return;
  if (responseText.length > 2000) return;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;

  const { data: review } = await sb
    .from("reviews")
    .select("reviewee_id, resolution_status")
    .eq("id", reviewId)
    .single();

  if (!review || review.reviewee_id !== seller.id || review.resolution_status !== "none") return;

  await sb
    .from("reviews")
    .update({
      response_text: responseText,
      response_at: new Date().toISOString(),
      resolution_status: "pending",
    })
    .eq("id", reviewId);

  revalidatePath("/seller/reviews");
}
