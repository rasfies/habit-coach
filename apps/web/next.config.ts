import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable React strict mode for better development warnings
  reactStrictMode: true,

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
