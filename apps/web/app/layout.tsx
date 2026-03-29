import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

// ---------------------------------------------------------------------------
// Fonts
// ---------------------------------------------------------------------------

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export const metadata: Metadata = {
  title: {
    default: "HabitAI — Build habits. Together.",
    template: "%s | HabitAI",
  },
  description:
    "Build lasting habits with AI-powered coaching and real social accountability. Free forever.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "https://habitai.app"
  ),
  openGraph: {
    title: "HabitAI — Build habits. Together.",
    description:
      "AI coaching + accountability groups. Join 10,000+ people building better habits.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#4F46E5",
  width: "device-width",
  initialScale: 1,
};

// ---------------------------------------------------------------------------
// Root layout
// ---------------------------------------------------------------------------

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="min-h-screen bg-neutral-50 font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
