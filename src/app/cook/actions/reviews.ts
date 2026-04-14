"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireCookProfile } from "@/lib/auth";

// ── Review response ─────────────────────────────────────────────────

export async function respondToReview(formData: FormData) {
  const { cookProfile: cook } = await requireCookProfile();
  const supabase = await createClient();

  const reviewId = String(formData.get("review_id") ?? "");
  const responseText = String(formData.get("response_text") ?? "").trim();
  if (!reviewId || !responseText) return;

  // Verify this review is addressed to the cook
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: review } = await (supabase as any)
    .from("reviews")
    .select("reviewee_id, resolution_status")
    .eq("id", reviewId)
    .single();

  if (!review || review.reviewee_id !== cook.id || review.resolution_status !== "none") return;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from("reviews")
    .update({
      response_text: responseText,
      response_at: new Date().toISOString(),
      resolution_status: "pending",
    })
    .eq("id", reviewId);

  revalidatePath("/cook/reviews");
}
