import "server-only";
import { createServerClient as createSSRServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@habit-coach/db";

/**
 * Server-side Supabase client for use in Route Handlers and Server Components.
 * Uses cookie-based session management via @supabase/ssr.
 *
 * Call this at the top of every protected API route:
 *   const supabase = await createServerClient()
 *   const { data: { user } } = await supabase.auth.getUser()
 */
export async function createServerClient() {
  const cookieStore = await cookies();

  return createSSRServerClient<Database>(
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
            // setAll may be called in a Server Component context where cookies
            // cannot be set. Route Handlers can always set cookies.
          }
        },
      },
    }
  );
}

/**
 * Service-role client for privileged server operations (AI generation, cron jobs).
 * NEVER expose the service key to the browser or include in client bundles.
 * Bypasses RLS — use only where intentional.
 */
export async function createServiceRoleClient() {
  const cookieStore = await cookies();

  return createSSRServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
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
            // intentionally ignored
          }
        },
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
