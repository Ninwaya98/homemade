import { redirect } from "next/navigation";
import { cache } from "react";

import { createClient } from "@/lib/supabase/server";
import type { Profile, UserRole } from "@/lib/types";

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
 * Use at the top of a route handler / server component to enforce a
 * specific role. Redirects to /sign-in if unauthenticated, or to the
 * user's own home if they have the wrong role.
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
