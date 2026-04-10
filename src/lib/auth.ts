import { redirect } from "next/navigation";
import { cache } from "react";

import { createClient } from "@/lib/supabase/server";
import type { Profile, UserRole, CookProfile, SellerProfile } from "@/lib/types";

/**
 * Loads the current user's profile (role + name) for the active request.
 * Cached per render so calling it from layout AND page only hits the
 * database once.
 */
export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (data as Profile | null) ?? null;
});

/**
 * Ensures the user is authenticated. Redirects to /sign-in if not.
 * Does NOT check role — any logged-in user passes.
 */
export async function requireAuth(): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) {
    redirect("/sign-in");
  }
  return profile;
}

/**
 * Use at the top of a route handler / server component to enforce a
 * specific role. Only used for admin now — cook/seller use capability checks.
 * Redirects to /sign-in if unauthenticated, or to the user's own home
 * if they have the wrong role.
 */
export async function requireRole(role: UserRole | "seller"): Promise<Profile> {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/sign-in");
  }
  if (profile.role !== role) {
    const home: Record<string, string> = { cook: "/cook", seller: "/seller", admin: "/admin", customer: "/customer" };
    redirect(home[profile.role as string] ?? "/customer");
  }
  return profile;
}

/**
 * Ensures the user is authenticated AND has a cook_profiles row.
 * If no cook profile exists, redirects to /account where they can apply.
 */
export async function requireCookProfile(): Promise<{ profile: Profile; cookProfile: CookProfile }> {
  const profile = await requireAuth();
  const supabase = await createClient();

  const { data } = await supabase
    .from("cook_profiles")
    .select("*")
    .eq("id", profile.id)
    .maybeSingle();

  if (!data) {
    redirect("/account");
  }

  return { profile, cookProfile: data as CookProfile };
}

/**
 * Ensures the user is authenticated AND has a seller_profiles row.
 * If no seller profile exists, redirects to /account where they can apply.
 */
export async function requireSellerProfile(): Promise<{ profile: Profile; sellerProfile: SellerProfile }> {
  const profile = await requireAuth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any;

  const { data } = await supabase
    .from("seller_profiles")
    .select("*")
    .eq("id", profile.id)
    .maybeSingle();

  if (!data) {
    redirect("/account");
  }

  return { profile, sellerProfile: data as SellerProfile };
}
