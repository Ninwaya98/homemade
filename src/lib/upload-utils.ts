import { createClient } from "@/lib/supabase/server";

function safeExt(filename: string): string {
  return filename.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
}

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg", "image/png", "image/webp", "image/gif",
  "image/bmp", "image/tiff", "image/avif", "image/heic", "image/svg+xml",
];

export async function uploadPhoto(
  file: File,
  bucket: string,
  userId: string,
  prefix: string,
): Promise<{ url: string | null; error: string | null }> {
  if (file.size > 5 * 1024 * 1024) {
    return { url: null, error: "Photo must be under 5 MB" };
  }
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return { url: null, error: "Invalid image format" };
  }

  const ext = safeExt(file.name);
  const path = `${userId}/${prefix}_${Date.now()}.${ext}`;
  const supabase = await createClient();

  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });

  if (error) return { url: null, error: error.message };

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);
  return { url: urlData.publicUrl, error: null };
}
