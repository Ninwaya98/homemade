"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { requireAuth, requireSellerProfile } from "@/lib/auth";
import type { ProductCategory } from "@/lib/types";
import { isTransitionAllowed, buildStatusExtras } from "@/lib/order-utils";

const ALLOWED_IMAGE_EXTS = new Set(["jpg", "jpeg", "png", "webp", "gif", "bmp", "tiff", "tif", "avif", "heic", "heif", "svg"]);
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/bmp", "image/tiff", "image/avif", "image/heic", "image/heif", "image/svg+xml"]);

function safeExt(filename: string, fallback: string): string {
  const raw = filename.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "";
  return ALLOWED_IMAGE_EXTS.has(raw) ? raw : fallback;
}

function validateFileType(file: File, allowedTypes: Set<string>): boolean {
  return allowedTypes.has(file.type);
}

// =====================================================================
// Seller onboarding
// =====================================================================

export type OnboardingState = { error?: string; ok?: boolean } | undefined;

export async function submitSellerOnboarding(
  _state: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const profile = await requireAuth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any;

  const shopName = String(formData.get("shop_name") ?? "").trim();
  const shopDescription = String(formData.get("shop_description") ?? "").trim();
  const category = String(formData.get("category") ?? "") as ProductCategory;
  const phone = String(formData.get("phone") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();

  if (!shopName || shopName.length < 3) {
    return { error: "Shop name must be at least 3 characters." };
  }
  if (shopName.length > 200) {
    return { error: "Shop name is too long (max 200 characters)." };
  }
  if (shopDescription.length > 2000) {
    return { error: "Shop description is too long (max 2000 characters)." };
  }
  if (shopDescription.length < 20) {
    return { error: "Tell customers more about your shop — at least 20 characters." };
  }
  if (!category) {
    return { error: "Pick a primary category for your shop." };
  }
  if (!phone) {
    return { error: "We need a phone number so customers can reach you." };
  }
  if (!/^[+\d\s\-()]{7,20}$/.test(phone)) {
    return { error: "Please enter a valid phone number." };
  }
  if (!location) {
    return { error: "Add a location so we can match you with nearby customers." };
  }

  // Update profile with phone + location (via RPC to bypass RLS recursion)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: rpcError } = await (supabase as any).rpc("update_own_profile", { p_phone: phone, p_location: location });
  if (rpcError) return { error: `Could not save profile: ${rpcError.message}` };

  // Optional photo upload
  const photoFile = formData.get("photo") as File | null;
  let photoPublicUrl: string | null = null;
  if (photoFile && photoFile.size > 0) {
    if (photoFile.size > 5 * 1024 * 1024) {
      return { error: "Photo is too large (max 5 MB)." };
    }
    if (!validateFileType(photoFile, ALLOWED_IMAGE_TYPES)) {
      return { error: "Photo must be a JPG, PNG, WebP, or GIF image." };
    }
    const ext = safeExt(photoFile.name, "jpg");
    const path = `${profile.id}/shop_${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("product-photos")
      .upload(path, photoFile, { contentType: photoFile.type || "image/jpeg", upsert: true });
    if (error) return { error: `Could not upload photo: ${error.message}` };
    photoPublicUrl = supabase.storage.from("product-photos").getPublicUrl(path).data.publicUrl;
  }

  // Upsert seller profile
  const { error } = await supabase.from("seller_profiles").upsert(
    {
      id: profile.id,
      shop_name: shopName,
      shop_description: shopDescription,
      category,
      photo_url: photoPublicUrl,
      status: "pending",
    },
    { onConflict: "id" },
  );
  if (error) return { error: `Could not save shop profile: ${error.message}` };

  revalidatePath("/seller", "layout");
  redirect("/seller?onboarded=1");
}

// =====================================================================
// Product CRUD
// =====================================================================

export type ProductFormState = { error?: string } | undefined;

export async function createProduct(
  _state: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const { profile } = await requireSellerProfile();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any;

  // Verify seller is approved
  const { data: sellerProfile } = await supabase
    .from("seller_profiles")
    .select("status")
    .eq("id", profile.id)
    .single();
  if (!sellerProfile || sellerProfile.status !== "approved") {
    return { error: "You need to be approved before adding products." };
  }

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

  if (!name) return { error: "Product name is required." };
  if (name.length > 200) return { error: "Product name is too long (max 200 characters)." };
  if (description.length > 5000) return { error: "Description is too long (max 5000 characters)." };
  if (materials && materials.length > 500) return { error: "Materials is too long (max 500 characters)." };
  if (dimensions && dimensions.length > 500) return { error: "Dimensions is too long (max 500 characters)." };
  if (!Number.isFinite(priceDollars) || priceDollars <= 0) {
    return { error: "Price must be greater than zero." };
  }
  if (!category) return { error: "Select a category." };
  if (stockQuantity < 1) return { error: "Stock quantity must be at least 1." };

  // Upload photos (multiple, max 5)
  const photoFiles = (formData.getAll("photos") as File[]).filter((f) => f && f.size > 0);
  if (photoFiles.length > 5) {
    return { error: "You can upload up to 5 photos." };
  }
  const photoUrls: string[] = [];
  for (const file of photoFiles) {
    if (file.size > 5 * 1024 * 1024) {
      return { error: `Photo "${file.name}" is too large (max 5 MB).` };
    }
    if (!validateFileType(file, ALLOWED_IMAGE_TYPES)) {
      return { error: `"${file.name}" must be a JPG, PNG, WebP, or GIF image.` };
    }
    const ext = safeExt(file.name, "jpg");
    const path = `${profile.id}/product_${Date.now()}_${Math.random().toString(36).slice(2, 6)}.${ext}`;
    const { error } = await supabase.storage
      .from("product-photos")
      .upload(path, file, { contentType: file.type || "image/jpeg", upsert: true });
    if (error) return { error: `Could not upload photo: ${error.message}` };
    photoUrls.push(supabase.storage.from("product-photos").getPublicUrl(path).data.publicUrl);
  }

  const { error } = await supabase.from("products").insert({
    seller_id: profile.id,
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

  revalidatePath("/seller/products");
  redirect("/seller/products?created=1");
}

export async function updateProduct(
  productId: string,
  _state: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const { profile } = await requireSellerProfile();
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

  if (!name) return { error: "Product name is required." };
  if (name.length > 200) return { error: "Product name is too long (max 200 characters)." };
  if (description.length > 5000) return { error: "Description is too long (max 5000 characters)." };
  if (materials && materials.length > 500) return { error: "Materials is too long (max 500 characters)." };
  if (dimensions && dimensions.length > 500) return { error: "Dimensions is too long (max 500 characters)." };
  if (!Number.isFinite(priceDollars) || priceDollars <= 0) {
    return { error: "Price must be greater than zero." };
  }

  // Retained photos (existing URLs the user kept)
  const retainedRaw = String(formData.get("retained_photo_urls") ?? "");
  const retainedUrls = retainedRaw.split(",").filter(Boolean);

  // New uploads (max 5 total including retained)
  const photoFiles = (formData.getAll("photos") as File[]).filter((f) => f && f.size > 0);
  if (retainedUrls.length + photoFiles.length > 5) {
    return { error: "You can have up to 5 photos total." };
  }
  const newUrls: string[] = [];
  for (const file of photoFiles) {
    if (file.size > 5 * 1024 * 1024) {
      return { error: `Photo "${file.name}" is too large (max 5 MB).` };
    }
    if (!validateFileType(file, ALLOWED_IMAGE_TYPES)) {
      return { error: `"${file.name}" must be a JPG, PNG, WebP, or GIF image.` };
    }
    const ext = safeExt(file.name, "jpg");
    const path = `${profile.id}/product_${Date.now()}_${Math.random().toString(36).slice(2, 6)}.${ext}`;
    const { error } = await supabase.storage
      .from("product-photos")
      .upload(path, file, { contentType: file.type || "image/jpeg", upsert: true });
    if (error) return { error: `Could not upload photo: ${error.message}` };
    newUrls.push(supabase.storage.from("product-photos").getPublicUrl(path).data.publicUrl);
  }

  // Auto-sync status with stock quantity
  const { data: currentProduct } = await supabase
    .from("products")
    .select("status, stock_quantity")
    .eq("id", productId)
    .eq("seller_id", profile.id)
    .single();

  let newStatus = currentProduct?.status;
  if (stockQuantity === 0 && currentProduct?.status === "active") {
    newStatus = "out_of_stock";
  } else if (stockQuantity > 0 && currentProduct?.status === "out_of_stock") {
    newStatus = "active";
  }

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
    .eq("seller_id", profile.id);
  if (error) return { error: `Could not save product: ${error.message}` };

  revalidatePath("/seller/products");
  revalidatePath(`/seller/products/${productId}`);
  redirect("/seller/products?updated=1");
}

export async function setProductStatus(productId: string, status: "active" | "paused" | "out_of_stock") {
  const { profile } = await requireSellerProfile();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any;

  // If reactivating, check stock to decide between active vs out_of_stock
  let finalStatus = status;
  if (status === "active") {
    const { data: product } = await supabase
      .from("products")
      .select("stock_quantity")
      .eq("id", productId)
      .eq("seller_id", profile.id)
      .single();
    if (product && product.stock_quantity === 0) {
      finalStatus = "out_of_stock";
    }
  }

  await supabase
    .from("products")
    .update({ status: finalStatus })
    .eq("id", productId)
    .eq("seller_id", profile.id);
  revalidatePath("/seller/products");
}

export async function deleteProduct(productId: string) {
  const { profile } = await requireSellerProfile();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any;

  // Check for active orders
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
      .eq("seller_id", profile.id);
    revalidatePath("/seller/products");
    return;
  }

  await supabase.from("products").delete().eq("id", productId).eq("seller_id", profile.id);
  revalidatePath("/seller/products");
}

// =====================================================================
// Order management (seller side)
// =====================================================================

export async function setSellerOrderStatus(
  orderId: string,
  status: "confirmed" | "ready" | "completed" | "cancelled",
  estimatedReadyTime?: string,
) {
  const { profile } = await requireSellerProfile();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any;

  const { data: order } = await supabase
    .from("orders")
    .select("status, seller_id, quantity, product_id")
    .eq("id", orderId)
    .eq("vertical", "market")
    .single();
  if (!order || order.seller_id !== profile.id) return;

  if (!isTransitionAllowed(order.status, status)) return;

  await supabase.from("orders").update({ status }).eq("id", orderId);

  const extras = buildStatusExtras(status, estimatedReadyTime);
  if (Object.keys(extras).length > 0) {
    await supabase.from("orders").update(extras).eq("id", orderId);
  }

  // Restore stock when seller cancels.
  //
  // NOTE: Known race condition — if two cancellations for the same product run
  // concurrently, both may read the same `stock_quantity` and one restore could
  // be lost. A proper fix requires an atomic SQL increment (RPC). The current
  // approach is safe in that it never produces negative stock — the worst case
  // is stock being slightly lower than expected, which is a conservative failure
  // mode (seller sees fewer available than actual).
  if (status === "cancelled" && order.product_id) {
    const { data: product } = await supabase
      .from("products")
      .select("stock_quantity, status")
      .eq("id", order.product_id)
      .single();
    if (product) {
      const restoredStock = product.stock_quantity + order.quantity;
      const updates: Record<string, unknown> = {
        stock_quantity: restoredStock,
      };
      // Re-activate product if it was out of stock and now has inventory
      if (product.status === "out_of_stock" && restoredStock > 0) {
        updates.status = "active";
      }
      await supabase.from("products").update(updates).eq("id", order.product_id);
    }
  }

  revalidatePath("/seller/orders");
  revalidatePath(`/seller/orders/${orderId}`);
}

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
