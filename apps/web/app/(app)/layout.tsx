import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { Sidebar } from "@/components/layout/sidebar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { AppHeader } from "@/components/layout/app-header";

// ---------------------------------------------------------------------------
// Auth check + user data fetch (server component)
// ---------------------------------------------------------------------------

async function getUser() {
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
            // Ignore — setAll may fail in some read-only contexts
          }
        },
      },
    }
  );

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;

  // TODO: replace with API call — GET /api/users/me
  const { data: profile } = await supabase
    .from("users")
    .select("display_name, avatar_url, email, onboarding_complete")
    .eq("id", user.id)
    .single();

  return {
    id: user.id,
    email: user.email ?? "",
    displayName: profile?.display_name ?? user.email ?? "User",
    avatarUrl: profile?.avatar_url ?? null,
    onboardingComplete: profile?.onboarding_complete ?? false,
  };
}

// ---------------------------------------------------------------------------
// App layout
// ---------------------------------------------------------------------------

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  // Redirect unauthenticated users to login
  if (!user) {
    redirect("/login");
  }

  // Redirect users who haven't finished onboarding
  // (allow /onboarding path through)

  return (
    <div className="flex h-screen overflow-hidden bg-neutral-50">
      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <Sidebar
          userName={user.displayName}
          userEmail={user.email}
          userAvatarUrl={user.avatarUrl}
        />
      </div>

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top header */}
        <AppHeader
          userName={user.displayName}
          avatarUrl={user.avatarUrl}
        />

        {/* Scrollable page content */}
        <main
          className="flex-1 overflow-y-auto pb-20 md:pb-0"
          id="main-content"
        >
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <BottomNav />
    </div>
  );
}
