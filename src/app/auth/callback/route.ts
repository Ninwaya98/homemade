import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * Supabase email-confirmation callback. When a user clicks the magic
 * link in their confirmation email, Supabase sends them here with a
 * `code` query param. We exchange that code for a session, then send
 * them to the right dashboard based on their capabilities.
 *
 * Also handles "next" query param so other flows (e.g. password reset)
 * can route to a specific page after auth.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const rawNext = url.searchParams.get("next");
  // Prevent open-redirect: only allow relative paths starting with /
  const next = rawNext && rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : null;

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

  // Resolve destination based on capabilities, not role.
  let destination = next ?? "/customer";
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
  }

  return NextResponse.redirect(new URL(destination, url));
}
