import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

/**
 * Supabase OAuth callback handler.
 * Exchanges the `code` for a session and redirects the user.
 * Called after Google OAuth flow completes.
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/dashboard";

  if (code) {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Ignore in read-only contexts
            }
          },
        },
      }
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Ensure user profile row exists (Google OAuth creates auth user but not profile row)
      await supabase.from("users").upsert(
        {
          id: data.user.id,
          email: data.user.email ?? "",
          display_name:
            data.user.user_metadata?.full_name ??
            data.user.email?.split("@")[0] ??
            "User",
          onboarding_complete: false,
        },
        { onConflict: "id", ignoreDuplicates: true }
      );

      // Check if onboarding is complete
      const { data: profile } = await supabase
        .from("users")
        .select("onboarding_complete")
        .eq("id", data.user.id)
        .single();

      if (!profile?.onboarding_complete) {
        return NextResponse.redirect(new URL("/onboarding", requestUrl.origin));
      }

      return NextResponse.redirect(new URL(next, requestUrl.origin));
    }
  }

  // On error, redirect to login
  return NextResponse.redirect(new URL("/login?error=oauth_failed", requestUrl.origin));
}
