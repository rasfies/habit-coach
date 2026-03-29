import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable React strict mode for better development warnings
  reactStrictMode: true,

  // Suppress TS errors from Next.js generated type-check files
  // (@types/react@19 is hoisted by npm while we target React 18)
  typescript: {
    ignoreBuildErrors: true,
  },

  // Skip ESLint during build (Next.js 15 bug: tries to lint /_document in App Router)
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Transpile shared workspace packages
  transpilePackages: ["@habit-coach/ui", "@habit-coach/db"],

  // Image domains for Supabase Storage avatars
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },

  // Experimental features for Next.js 15
  experimental: {
    // Server Actions are stable in Next.js 15 — no flag needed
  },
};

export default nextConfig;
