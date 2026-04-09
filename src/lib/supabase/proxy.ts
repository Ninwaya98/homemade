import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

import type { Database } from "@/lib/database.types";

/**
 * Refreshes the Supabase session on every request and returns a
 * NextResponse with the latest auth cookies attached. Called from
 * the project-root proxy.ts file.
 *
 * Note: in @supabase/ssr 0.10+, setAll receives a second `headers`
 * argument with cache-busting headers that MUST be propagated, or
 * CDNs may serve one user's session token to another user.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
          if (headers) {
            for (const [key, value] of Object.entries(headers)) {
              response.headers.set(key, value);
            }
          }
        },
      },
    },
  );

  // IMPORTANT: getUser() must be called immediately after createServerClient
  // and before any other code so the session refresh happens. Do not remove.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Optimistic redirect: anyone hitting a protected area without a session
  // bounces to /sign-in. Real authorization still happens server-side in
  // each route handler / server component.
  const path = request.nextUrl.pathname;
  const isProtected =
    path.startsWith("/cook") ||
    path.startsWith("/customer") ||
    path.startsWith("/admin");

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  return response;
}
