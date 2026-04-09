import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import type { Database } from "@/lib/database.types";

/**
 * Server-side Supabase client. Use inside Server Components, Server
 * Actions, and Route Handlers.
 *
 * Cookies are read from the incoming request and written via the
 * Next.js cookies() API. In a pure Server Component (no mutation
 * context) the setAll calls will throw — we swallow that case because
 * the proxy.ts at the project root is responsible for refreshing the
 * session cookie on every request.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Called from a Server Component — safe to ignore because
            // proxy.ts will refresh the session on the next request.
          }
        },
      },
    },
  );
}
