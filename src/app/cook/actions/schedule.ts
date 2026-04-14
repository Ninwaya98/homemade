"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { requireCookProfile } from "@/lib/auth";
import { DEFAULT_DAILY_PORTION_CAP } from "@/lib/constants";

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
