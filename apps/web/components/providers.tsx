"use client";

import React, { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";

// ---------------------------------------------------------------------------
// PostHog initialisation (client-side only)
// ---------------------------------------------------------------------------

if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host:
      process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://app.posthog.com",
    capture_pageview: false, // we capture manually below
    capture_pageleave: true,
  });
}

function PostHogPageview() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (pathname) {
      let url = window.origin + pathname;
      if (searchParams?.toString()) {
        url = `${url}?${searchParams.toString()}`;
      }
      posthog.capture("$pageview", { $current_url: url });
    }
  }, [pathname, searchParams]);

  return null;
}

// ---------------------------------------------------------------------------
// Auth state listener
// ---------------------------------------------------------------------------

function SupabaseAuthListener() {
  // Auth state changes are handled by server-side middleware / redirect logic.
  // This component is a placeholder for future real-time auth sync if needed.
  return null;
}

// ---------------------------------------------------------------------------
// Root Providers wrapper
// ---------------------------------------------------------------------------

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PostHogProvider client={posthog}>
      <PostHogPageview />
      <SupabaseAuthListener />
      {children}
    </PostHogProvider>
  );
}

export default Providers;
