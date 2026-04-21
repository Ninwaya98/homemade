import { z } from "zod";

// =====================================================================
// Reusable field schemas
// =====================================================================

export const phoneSchema = z
  .string()
  .min(1, "We need a phone number so customers can reach you.")
  .regex(/^[+\d\s\-()]{7,20}$/, "Please enter a valid phone number.");

export const locationSchema = z
  .string()
  .min(1, "Add a location so we can match you with nearby customers.")
  .min(3, "Location must be at least 3 characters.")
  .max(200, "Location is too long (max 200 characters).");

// =====================================================================
// Auth
// =====================================================================

export const signUpSchema = z.object({
  email: z
    .string()
    .min(1, "Please fill in your name, email, and password.")
    .max(320, "Email is too long."),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters."),
  full_name: z
    .string()
    .min(1, "Please fill in your name, email, and password.")
    .max(255, "Name is too long (max 255 characters)."),
});

// =====================================================================
// Seller onboarding
// =====================================================================

export const sellerOnboardingSchema = z.object({
  shop_name: z
    .string()
    .min(3, "Shop name must be at least 3 characters.")
    .max(200, "Shop name is too long (max 200 characters)."),
  shop_description: z
    .string()
    .min(20, "Tell customers more about your shop — at least 20 characters.")
    .max(2000, "Shop description is too long (max 2000 characters)."),
  category: z
    .string()
    .min(1, "Pick a primary category for your shop."),
  phone: z
    .string()
    .min(1, "We need a phone number so customers can reach you.")
    .regex(/^[+\d\s\-()]{7,20}$/, "Please enter a valid phone number."),
  location: z
    .string()
    .min(1, "Add a location so we can match you with nearby customers."),
});

// =====================================================================
// Product (seller)
// =====================================================================

export const productSchema = z.object({
  name: z
    .string()
    .min(1, "Product name is required.")
    .max(200, "Product name is too long (max 200 characters)."),
  description: z
    .string()
    .max(5000, "Description is too long (max 5000 characters).")
    .optional(),
  price: z
    .number()
    .positive("Price must be greater than zero.")
    .finite("Price must be greater than zero."),
  category: z
    .string()
    .min(1, "Select a category."),
  stock_quantity: z
    .number()
    .int()
    .min(0)
    .max(999),
  materials: z
    .string()
    .max(500, "Materials is too long (max 500 characters).")
    .nullable()
    .optional(),
  dimensions: z
    .string()
    .max(500, "Dimensions is too long (max 500 characters).")
    .nullable()
    .optional(),
});

// =====================================================================
// Address
// =====================================================================

export const addressSchema = z.object({
  label: z
    .string()
    .max(100, "Label is too long (max 100 characters)"),
  address_line: z
    .string()
    .min(1, "Address is required")
    .max(500, "Address is too long (max 500 characters)"),
  city: z
    .string()
    .max(200, "City is too long (max 200 characters)")
    .nullable()
    .optional(),
  notes: z
    .string()
    .max(500, "Notes are too long (max 500 characters)")
    .nullable()
    .optional(),
});

// =====================================================================
// Order notes / delivery address
// =====================================================================

export const orderNotesSchema = z.object({
  notes: z
    .string()
    .max(500, "Notes are too long (max 500 characters).")
    .nullable()
    .optional(),
  delivery_address: z
    .string()
    .max(500, "Delivery address is too long (max 500 characters).")
    .nullable()
    .optional(),
});

// =====================================================================
// Review
// =====================================================================

export const reviewSchema = z.object({
  order_id: z
    .string()
    .min(1),
  sentiment: z
    .enum(["like", "dislike"]),
  text: z
    .string()
    .max(2000)
    .nullable()
    .optional(),
});
