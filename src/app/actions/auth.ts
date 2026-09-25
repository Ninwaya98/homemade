"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/safe-redirect";
import { signUpSchema } from "@/lib/schemas";

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

  const parsed = signUpSchema.safeParse({ email, password, full_name: fullName });
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0].message,
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
  // Prevent open-redirect: only allow same-site paths
  const next = safeNextPath(rawNext) ?? "";

  if (!email || !password) {
    return { error: "Email and password are required.", fields: { email } };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message, fields: { email } };
  }

  // Everyone lands on /customer (browse-first). Admins go to /admin.
  // Cooks/sellers access their dashboards via "Manage shop" in the nav.
  let destination = next || "/customer";
  if (!next) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      if (profile?.role === "admin") {
        destination = "/admin";
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
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/auth/callback?next=/reset-password`,
  });

  if (error) {
    return { error: error.message, fields: { email } };
  }

  return { success: true };
}

export type UpdatePasswordState = { error?: string } | undefined;

// Second half of the reset flow: the email link signs the user in via
// /auth/callback, which sends them to /reset-password to pick a new one.
export async function updatePassword(
  _state: UpdatePasswordState,
  formData: FormData,
): Promise<UpdatePasswordState> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }
  if (password !== confirm) {
    return { error: "The two passwords do not match." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "This reset link has expired. Please request a new one." };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };

  redirect("/customer");
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

  // Deletes the auth user; the profile and its shop cascade from it.
  // Orders are kept (on delete restrict), so an account with orders
  // cannot be removed yet.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: deleteError } = await (supabase as any).rpc("delete_own_account");

  if (deleteError) {
    if (deleteError.message.includes("foreign key")) {
      return {
        error:
          "This account has orders on record, so it cannot be deleted yet. Please contact us.",
      };
    }
    return { error: "Cannot delete account at this time. Please try again later." };
  }

  // Sign out and redirect to home.
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/?deleted=1");
}
