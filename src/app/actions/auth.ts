"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/types";

export type AuthFormState =
  | {
      error?: string;
      fields?: { email?: string; full_name?: string; role?: UserRole };
    }
  | undefined;

function isUserRole(value: string | null): value is UserRole {
  return value === "cook" || value === "customer";
}

export async function signUp(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("full_name") ?? "").trim();
  const rawRole = formData.get("role");
  const role = typeof rawRole === "string" && isUserRole(rawRole) ? rawRole : "customer";

  if (!email || !password || !fullName) {
    return {
      error: "Please fill in your name, email, and password.",
      fields: { email, full_name: fullName, role },
    };
  }
  if (password.length < 8) {
    return {
      error: "Password must be at least 8 characters.",
      fields: { email, full_name: fullName, role },
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, role },
    },
  });

  if (error) {
    return {
      error: error.message,
      fields: { email, full_name: fullName, role },
    };
  }

  // The handle_new_user() trigger inserts the profile row server-side.
  // Cooks land on their (still pending-approval) dashboard; customers
  // land on the browse feed.
  revalidatePath("/", "layout");
  redirect(role === "cook" ? "/cook" : "/customer");
}

export async function signIn(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "");

  if (!email || !password) {
    return { error: "Email and password are required.", fields: { email } };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message, fields: { email } };
  }

  // Look up the user's role to decide where to send them.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let destination = next || "/";
  if (!next && user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (profile?.role === "cook") destination = "/cook";
    else if (profile?.role === "admin") destination = "/admin";
    else destination = "/customer";
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
