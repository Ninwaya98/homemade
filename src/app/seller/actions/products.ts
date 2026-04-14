"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { requireSellerProfile } from "@/lib/auth";
import type { ProductCategory } from "@/lib/types";
import { ALLOWED_IMAGE_TYPES, safeImageExt, validateFileType } from "@/lib/file-validation";

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
    const ext = safeImageExt(file.name);
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
    const ext = safeImageExt(file.name);
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
