"use server";

import { revalidatePath } from "next/cache";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { adminSellerUpdateSchema, productSchema } from "@/lib/schemas";
import { ALLOWED_IMAGE_TYPES, safeImageExt, validateFileType } from "@/lib/file-validation";
import type { ProductCategory } from "@/lib/types";

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

// =====================================================================
// Admin-side product CRUD — operates on any seller's products by
// explicit sellerId. RLS allows admin UPDATE/INSERT/DELETE on products;
// these wrappers exist so admins don't need a seller_profiles row.
// =====================================================================

export type ProductFormState = { error?: string } | undefined;

export async function adminCreateProduct(
  sellerId: string,
  _state: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  await requireRole("admin");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any;

  // Verify the target seller exists and is approved
  const { data: seller } = await supabase
    .from("seller_profiles")
    .select("status")
    .eq("id", sellerId)
    .maybeSingle();
  if (!seller) return { error: "Seller not found." };

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const priceDollars = Number(formData.get("price") ?? 0);
  const category = String(formData.get("category") ?? "") as ProductCategory;
  const subcategory = String(formData.get("subcategory") ?? "").trim() || null;
  const materials = String(formData.get("materials") ?? "").trim() || null;
  const dimensions = String(formData.get("dimensions") ?? "").trim() || null;
  const condition = String(formData.get("condition") ?? "handmade");
  const stockQuantity = Math.max(0, Math.min(999, Number(formData.get("stock_quantity") ?? 0)));
  const ingredients = String(formData.get("ingredients") ?? "").trim() || null;

  const parsed = productSchema.safeParse({
    name,
    description: description || undefined,
    price: priceDollars,
    category,
    stock_quantity: stockQuantity,
    materials,
    dimensions,
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  if (stockQuantity < 1) return { error: "Stock quantity must be at least 1." };

  const photoFiles = (formData.getAll("photos") as File[]).filter((f) => f && f.size > 0);
  if (photoFiles.length > 5) return { error: "You can upload up to 5 photos." };
  const photoUrls: string[] = [];
  for (const file of photoFiles) {
    if (file.size > 5 * 1024 * 1024) return { error: `Photo "${file.name}" is too large (max 5 MB).` };
    if (!validateFileType(file, ALLOWED_IMAGE_TYPES)) {
      return { error: `"${file.name}" must be a JPG, PNG, WebP, or GIF image.` };
    }
    const ext = safeImageExt(file.name);
    const path = `${sellerId}/product_${Date.now()}_${Math.random().toString(36).slice(2, 6)}.${ext}`;
    const { error } = await supabase.storage
      .from("product-photos")
      .upload(path, file, { contentType: file.type || "image/jpeg", upsert: true });
    if (error) return { error: `Could not upload photo: ${error.message}` };
    photoUrls.push(supabase.storage.from("product-photos").getPublicUrl(path).data.publicUrl);
  }

  const { error } = await supabase.from("products").insert({
    seller_id: sellerId,
    name,
    description: description || null,
    price_cents: Math.round(priceDollars * 100),
    category,
    subcategory,
    materials,
    dimensions,
    condition,
    stock_quantity: stockQuantity,
    photo_urls: photoUrls,
    ingredients,
    status: stockQuantity > 0 ? "active" : "out_of_stock",
  });
  if (error) return { error: `Could not save product: ${error.message}` };

  revalidatePath(`/admin/sellers/${sellerId}`);
  redirect(`/admin/sellers/${sellerId}?product_created=1`);
}

export async function adminUpdateProduct(
  sellerId: string,
  productId: string,
  _state: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  await requireRole("admin");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any;

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const priceDollars = Number(formData.get("price") ?? 0);
  const category = String(formData.get("category") ?? "") as ProductCategory;
  const subcategory = String(formData.get("subcategory") ?? "").trim() || null;
  const materials = String(formData.get("materials") ?? "").trim() || null;
  const dimensions = String(formData.get("dimensions") ?? "").trim() || null;
  const condition = String(formData.get("condition") ?? "handmade");
  const stockQuantity = Math.max(0, Math.min(999, Number(formData.get("stock_quantity") ?? 0)));
  const ingredients = String(formData.get("ingredients") ?? "").trim() || null;

  const parsed = productSchema.safeParse({
    name,
    description: description || undefined,
    price: priceDollars,
    category,
    stock_quantity: stockQuantity,
    materials,
    dimensions,
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const retainedRaw = String(formData.get("retained_photo_urls") ?? "");
  const retainedUrls = retainedRaw.split(",").filter(Boolean);

  const photoFiles = (formData.getAll("photos") as File[]).filter((f) => f && f.size > 0);
  if (retainedUrls.length + photoFiles.length > 5) return { error: "You can have up to 5 photos total." };
  const newUrls: string[] = [];
  for (const file of photoFiles) {
    if (file.size > 5 * 1024 * 1024) return { error: `Photo "${file.name}" is too large (max 5 MB).` };
    if (!validateFileType(file, ALLOWED_IMAGE_TYPES)) {
      return { error: `"${file.name}" must be a JPG, PNG, WebP, or GIF image.` };
    }
    const ext = safeImageExt(file.name);
    const path = `${sellerId}/product_${Date.now()}_${Math.random().toString(36).slice(2, 6)}.${ext}`;
    const { error } = await supabase.storage
      .from("product-photos")
      .upload(path, file, { contentType: file.type || "image/jpeg", upsert: true });
    if (error) return { error: `Could not upload photo: ${error.message}` };
    newUrls.push(supabase.storage.from("product-photos").getPublicUrl(path).data.publicUrl);
  }

  const { data: currentProduct } = await supabase
    .from("products")
    .select("status")
    .eq("id", productId)
    .eq("seller_id", sellerId)
    .single();

  let newStatus = currentProduct?.status;
  if (stockQuantity === 0 && currentProduct?.status === "active") newStatus = "out_of_stock";
  else if (stockQuantity > 0 && currentProduct?.status === "out_of_stock") newStatus = "active";

  const { error } = await supabase
    .from("products")
    .update({
      name,
      description: description || null,
      price_cents: Math.round(priceDollars * 100),
      category,
      subcategory,
      materials,
      dimensions,
      condition,
      stock_quantity: stockQuantity,
      status: newStatus,
      photo_urls: [...retainedUrls, ...newUrls],
      ingredients,
    })
    .eq("id", productId)
    .eq("seller_id", sellerId);
  if (error) return { error: `Could not save product: ${error.message}` };

  revalidatePath(`/admin/sellers/${sellerId}`);
  redirect(`/admin/sellers/${sellerId}?product_updated=1`);
}

export async function adminSetProductStatus(
  sellerId: string,
  productId: string,
  status: "active" | "paused" | "out_of_stock",
) {
  await requireRole("admin");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any;

  let finalStatus = status;
  if (status === "active") {
    const { data: product } = await supabase
      .from("products")
      .select("stock_quantity")
      .eq("id", productId)
      .eq("seller_id", sellerId)
      .single();
    if (product && product.stock_quantity === 0) finalStatus = "out_of_stock";
  }

  await supabase
    .from("products")
    .update({ status: finalStatus })
    .eq("id", productId)
    .eq("seller_id", sellerId);
  revalidatePath(`/admin/sellers/${sellerId}`);
}

export async function adminDeleteProduct(sellerId: string, productId: string) {
  await requireRole("admin");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any;

  // If the product has active orders, soft-delete by pausing instead.
  const { count } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true })
    .eq("product_id", productId)
    .eq("vertical", "market")
    .in("status", ["pending", "confirmed", "ready"]);
  if (count && count > 0) {
    await supabase
      .from("products")
      .update({ status: "paused" })
      .eq("id", productId)
      .eq("seller_id", sellerId);
    revalidatePath(`/admin/sellers/${sellerId}`);
    return;
  }

  await supabase.from("products").delete().eq("id", productId).eq("seller_id", sellerId);
  revalidatePath(`/admin/sellers/${sellerId}`);
}
