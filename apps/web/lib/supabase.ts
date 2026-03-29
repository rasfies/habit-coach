import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@habit-coach/db";

/**
 * Browser-side Supabase client.
 * Use this in Client Components and browser-only code.
 * Server Components should use createServerClient from @supabase/ssr.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        flowType: "implicit",
      },
    }
  );
}

/**
 * Singleton for use in non-React browser contexts (e.g., utils).
 * Recreated lazily on first access.
 */
let _client: ReturnType<typeof createClient> | null = null;

export function getSupabaseBrowserClient() {
  if (!_client) {
    _client = createClient();
  }
  return _client;
}
