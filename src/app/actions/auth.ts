"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export type AuthFormState =
  | {
      error?: string;
      fields?: { email?: string; full_name?: string };
    }
  | undefined;

export async function signUp(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("full_name") ?? "").trim();

  if (!email || !password || !fullName) {
    return {
      error: "Please fill in your name, email, and password.",
      fields: { email, full_name: fullName },
    };
  }
  if (password.length < 8) {
    return {
      error: "Password must be at least 8 characters.",
      fields: { email, full_name: fullName },
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
    },
  });

  if (error) {
    return {
      error: error.message,
      fields: { email, full_name: fullName },
    };
  }

  // The handle_new_user() trigger inserts the profile row server-side
  // with role defaulting to 'customer'. Everyone starts as a customer
  // and can apply to cook or sell from their account page.
  revalidatePath("/", "layout");
  redirect("/customer");
}

export async function signIn(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const rawNext = String(formData.get("next") ?? "");
  // Prevent open-redirect: only allow relative paths starting with /
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "";

  if (!email || !password) {
    return { error: "Email and password are required.", fields: { email } };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message, fields: { email } };
  }

  // Determine where to send the user based on their capabilities.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let destination = next || "/customer";
  if (!next && user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    const role = profile?.role as string | undefined;

    if (role === "admin") {
      destination = "/admin";
    } else {
      // Check cook capability
      const { data: cookProfile } = await supabase
        .from("cook_profiles")
        .select("status")
        .eq("id", user.id)
        .maybeSingle();
      if (cookProfile) {
        destination = "/cook";
      } else {
        // Check seller capability
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: sellerProfile } = await (supabase as any)
          .from("seller_profiles")
          .select("status")
          .eq("id", user.id)
          .maybeSingle();
        if (sellerProfile) {
          destination = "/seller";
        }
      }
    }
  }

  revalidatePath("/", "layout");
  redirect(destination);
}

export type ResetPasswordState =
  | { error?: string; success?: boolean; fields?: { email?: string } }
  | undefined;

export async function resetPassword(
  _state: ResetPasswordState,
  formData: FormData,
): Promise<ResetPasswordState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) {
    return { error: "Please enter your email address.", fields: { email } };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/auth/callback?next=/sign-in`,
  });

  if (error) {
    return { error: error.message, fields: { email } };
  }

  return { success: true };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}

export type DeleteAccountState = { error?: string } | undefined;

export async function deleteAccount(
  _state: DeleteAccountState,
  formData: FormData,
): Promise<DeleteAccountState> {
  const confirmation = String(formData.get("confirmation") ?? "").trim();
  if (confirmation !== "DELETE") {
    return { error: "Type DELETE to confirm account deletion." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated." };
  }

  // Delete profile (cascades to cook_profiles, dishes, availability, reviews, payouts).
  // Orders are kept (on delete restrict) — we soft-delete by anonymising.
  const { error: profileError } = await supabase
    .from("profiles")
    .delete()
    .eq("id", user.id);

  if (profileError) {
    // If deletion fails due to active orders, inform the user.
    if (profileError.message.includes("restrict")) {
      return {
        error:
          "You have active orders. Please wait until all orders are completed or cancelled before deleting your account.",
      };
    }
    return { error: `Could not delete account: ${profileError.message}` };
  }

  // Sign out and redirect to home.
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/?deleted=1");
}
