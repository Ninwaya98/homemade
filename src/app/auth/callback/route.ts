import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * Supabase email-confirmation callback. When a user clicks the magic
 * link in their confirmation email, Supabase sends them here with a
 * `code` query param. We exchange that code for a session, then send
 * them to the right dashboard for their role.
 *
 * Also handles "next" query param so other flows (e.g. password reset)
 * can route to a specific page after auth.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next");

  if (!code) {
    return NextResponse.redirect(new URL("/sign-in?error=missing_code", url));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(
      new URL(`/sign-in?error=${encodeURIComponent(error.message)}`, url),
    );
  }

  // Resolve the user's role to pick a destination.
  let destination = next ?? "/";
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
      const role = profile?.role as string | undefined;
      if (role === "cook") destination = "/cook";
      else if (role === "seller") destination = "/seller";
      else if (role === "admin") destination = "/admin";
      else destination = "/customer";
    }
  }

  return NextResponse.redirect(new URL(destination, url));
}
