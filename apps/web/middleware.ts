<<<<<<< HEAD
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Supabase Auth middleware.
 *
 * Responsibilities:
 * 1. Refresh the Supabase session on every request (rotates cookies silently)
 * 2. Redirect unauthenticated users away from /app/* routes to /auth/login
 * 3. Redirect authenticated users away from /auth/* routes to /dashboard
 *
 * This runs at the edge — keep it lightweight (no DB queries, no heavy logic).
=======
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Supabase auth middleware.
 * Refreshes session cookies on every request and protects app routes.
>>>>>>> feat/frontend
 */
export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
<<<<<<< HEAD
          // Step 1: mutate the request
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          // Step 2: rebuild response with updated request
          supabaseResponse = NextResponse.next({ request });
          // Step 3: set on response so the browser receives them
=======
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
>>>>>>> feat/frontend
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

<<<<<<< HEAD
  // IMPORTANT: Do not write any logic between createServerClient and
  // supabase.auth.getUser(). A subtle bug can make it very difficult to debug
  // issues with users being randomly logged out.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Unauthenticated users trying to access protected routes → login
  if (!user && isProtectedRoute(pathname)) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/auth/login";
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Authenticated users hitting auth pages → dashboard
  if (user && isAuthRoute(pathname)) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = "/dashboard";
    return NextResponse.redirect(dashboardUrl);
=======
  // Refresh session — important: do not remove this
  const { data: { user } } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Protected app routes — redirect to login if no session
  const isAppRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/habits") ||
    pathname.startsWith("/groups") ||
    pathname.startsWith("/analytics") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/onboarding");

  if (isAppRoute && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Auth pages — redirect to dashboard if already signed in
  const isAuthRoute =
    pathname.startsWith("/login") || pathname.startsWith("/signup");

  if (isAuthRoute && user) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
>>>>>>> feat/frontend
  }

  return supabaseResponse;
}

<<<<<<< HEAD
function isProtectedRoute(pathname: string): boolean {
  const protectedPrefixes = [
    "/dashboard",
    "/habits",
    "/coach",
    "/groups",
    "/analytics",
    "/settings",
    "/onboarding",
    "/api/users",
    "/api/habits",
    "/api/streaks",
    "/api/coaching",
    "/api/groups",
    "/api/analytics",
    "/api/notifications",
  ];
  return protectedPrefixes.some((prefix) => pathname.startsWith(prefix));
}

function isAuthRoute(pathname: string): boolean {
  return pathname.startsWith("/auth/login") || pathname.startsWith("/auth/signup");
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - Public files (images, fonts, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)",
=======
export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico
     * - public files (images, etc.)
     * - API routes (/api/*)
     * - auth callback (/auth/callback)
     */
    "/((?!_next/static|_next/image|favicon.ico|api/|auth/callback|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
>>>>>>> feat/frontend
  ],
};
