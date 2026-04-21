// =====================================================================
// HomeMade — shared file validation helpers
// =====================================================================

// Allowed file types for certificate uploads (legacy — retained for any
// dormant kitchen certificate files still referenced by migrations).
export const ALLOWED_CERT_TYPES = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);
export const ALLOWED_CERT_EXTS = new Set(["pdf", "jpg", "jpeg", "png", "webp"]);

// Allowed file types for image uploads
export const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg", "image/png", "image/webp", "image/gif",
  "image/bmp", "image/tiff", "image/avif", "image/heic", "image/svg+xml",
]);

export function safeCertExt(filename: string): string {
  const raw = filename.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "";
  return ALLOWED_CERT_EXTS.has(raw) ? raw : "pdf";
}

export function safeImageExt(filename: string): string {
  return filename.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
}

export function validateFileType(file: File, allowedTypes: Set<string>): boolean {
  return allowedTypes.has(file.type);
}
