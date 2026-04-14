"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { ALLOWED_CERT_TYPES, ALLOWED_IMAGE_TYPES, safeCertExt, safeImageExt, validateFileType } from "@/lib/file-validation";
import { cookOnboardingSchema } from "@/lib/schemas";

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

  const parsed = cookOnboardingSchema.safeParse({ bio, cuisine_tags: cuisineTags, phone, location });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message, fields };
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
    const ext = safeCertExt(certFile.name);
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
    const ext = safeImageExt(photoFile.name);
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
