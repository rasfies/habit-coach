import React from "react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "HabitAI — Build habits. Together.",
  description:
    "AI-powered habit coaching with accountability groups. Free forever.",
};

// ---------------------------------------------------------------------------
// Feature data
// ---------------------------------------------------------------------------

const features = [
  {
    emoji: "🤖",
    title: "AI Coaching",
    description:
      "Personalized daily messages that reference your actual habits by name — not generic \"keep it up\" filler. Your coach adapts to your streak data and behavior patterns.",
    color: "bg-brand-50 ring-brand-200",
    iconBg: "bg-brand-100 text-brand-600",
  },
  {
    emoji: "🔥",
    title: "Streak Tracking",
    description:
      "Celebrate every milestone with special coaching moments at Day 3, Day 7, and beyond. Built-in grace days mean one miss doesn't wipe your progress.",
    color: "bg-highlight-50 ring-highlight-200",
    iconBg: "bg-highlight-100 text-highlight-600",
  },
  {
    emoji: "👥",
    title: "Accountability Groups",
    description:
      "Join friends in private groups and see each other's streaks in real time. When people can see your progress, quitting feels different.",
    color: "bg-success-50 ring-success-200",
    iconBg: "bg-success-100 text-success-600",
  },
];

// ---------------------------------------------------------------------------
// Stat items
// ---------------------------------------------------------------------------

const stats = [
  { value: "10,000+", label: "People building habits" },
  { value: "87%", label: "30-day retention rate" },
  { value: "Free", label: "Forever, no paywalls" },
];

// ---------------------------------------------------------------------------
// Landing page
// ---------------------------------------------------------------------------

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <header className="sticky top-0 z-[200] border-b border-neutral-100 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 md:px-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
                <path fillRule="evenodd" d="M9 4.5a.75.75 0 0 1 .721.544l.813 2.846a3.75 3.75 0 0 0 2.576 2.576l2.846.813a.75.75 0 0 1 0 1.442l-2.846.813a3.75 3.75 0 0 0-2.576 2.576l-.813 2.846a.75.75 0 0 1-1.442 0l-.813-2.846a3.75 3.75 0 0 0-2.576-2.576l-2.846-.813a.75.75 0 0 1 0-1.442l2.846-.813A3.75 3.75 0 0 0 7.466 7.89l.813-2.846A.75.75 0 0 1 9 4.5Z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="text-lg font-bold text-neutral-900">HabitAI</span>
          </Link>
          {/* Nav links */}
          <nav className="hidden items-center gap-6 text-sm font-medium text-neutral-600 md:flex">
            <Link href="#features" className="hover:text-neutral-900">Features</Link>
            <Link href="#social-proof" className="hover:text-neutral-900">Reviews</Link>
          </nav>
          {/* Auth buttons */}
          <div className="flex items-center gap-2">
            <Link href="/login" className="rounded-xl px-3.5 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100">
              Sign in
            </Link>
            <Link href="/signup" className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700">
              Get started free
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-50 via-white to-highlight-50 px-4 py-20 text-center md:py-32">
        {/* Background decoration */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="absolute -top-20 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-brand-100 opacity-30 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-highlight-100 opacity-40 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-3xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-brand-100 px-4 py-1.5 text-sm font-medium text-brand-700">
            <span>✨</span> Free forever — no credit card needed
          </div>
          <h1 className="mb-5 text-4xl font-bold leading-tight tracking-tight text-neutral-900 md:text-5xl lg:text-6xl">
            Build habits.{" "}
            <span className="bg-gradient-to-r from-brand-600 to-brand-400 bg-clip-text text-transparent">
              Together.
            </span>
          </h1>
          <p className="mb-8 mx-auto max-w-xl text-lg text-neutral-600 leading-relaxed">
            The only free habit app with genuinely adaptive AI coaching and real social accountability groups — so you&apos;re never just accountable to an algorithm.
          </p>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/signup"
              className="rounded-xl bg-brand-600 px-7 py-3.5 text-base font-semibold text-white shadow-md transition-all hover:bg-brand-700 hover:shadow-lg"
            >
              Start for free →
            </Link>
            <Link
              href="/login"
              className="rounded-xl border border-neutral-200 bg-white px-7 py-3.5 text-base font-semibold text-neutral-700 shadow-sm transition-colors hover:bg-neutral-50"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section id="social-proof" className="border-y border-neutral-100 bg-white py-8">
        <div className="mx-auto max-w-3xl px-4">
          <p className="mb-6 text-center text-sm font-medium text-neutral-400 uppercase tracking-wider">
            Join 10,000+ people building better habits
          </p>
          <div className="grid grid-cols-3 gap-6 text-center">
            {stats.map((stat) => (
              <div key={stat.label}>
                <p className="font-mono text-2xl font-bold text-neutral-900 md:text-3xl">
                  {stat.value}
                </p>
                <p className="mt-1 text-xs text-neutral-500 md:text-sm">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-4 py-20 md:py-28">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <h2 className="mb-3 text-3xl font-bold text-neutral-900">
              Everything you need to build lasting habits
            </h2>
            <p className="mx-auto max-w-xl text-neutral-500">
              Three interlocking systems that work together to keep you on track — even when motivation fails.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {features.map((feat) => (
              <div
                key={feat.title}
                className={`rounded-2xl p-6 ring-1 ${feat.color}`}
              >
                <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl text-2xl ${feat.iconBg}`}>
                  {feat.emoji}
                </div>
                <h3 className="mb-2 text-lg font-semibold text-neutral-900">
                  {feat.title}
                </h3>
                <p className="text-sm text-neutral-600 leading-relaxed">
                  {feat.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA section */}
      <section className="bg-gradient-to-br from-brand-600 to-brand-800 px-4 py-16 text-center md:py-24">
        <div className="mx-auto max-w-xl">
          <h2 className="mb-4 text-3xl font-bold text-white">
            Ready to build habits that stick?
          </h2>
          <p className="mb-8 text-brand-200">
            Join thousands of people already building better habits with AI coaching and accountability groups.
          </p>
          <Link
            href="/signup"
            className="inline-block rounded-xl bg-white px-8 py-3.5 text-base font-semibold text-brand-700 shadow-lg transition-all hover:bg-brand-50 hover:shadow-xl"
          >
            Get started free — it&apos;s free forever
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-200 bg-white px-4 py-8">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-brand-600 text-white">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
                  <path fillRule="evenodd" d="M9 4.5a.75.75 0 0 1 .721.544l.813 2.846a3.75 3.75 0 0 0 2.576 2.576l2.846.813a.75.75 0 0 1 0 1.442l-2.846.813a3.75 3.75 0 0 0-2.576 2.576l-.813 2.846a.75.75 0 0 1-1.442 0l-.813-2.846a3.75 3.75 0 0 0-2.576-2.576l-2.846-.813a.75.75 0 0 1 0-1.442l2.846-.813A3.75 3.75 0 0 0 7.466 7.89l.813-2.846A.75.75 0 0 1 9 4.5Z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-sm font-bold text-neutral-800">HabitAI</span>
            </div>
            <p className="text-xs text-neutral-400">
              © {new Date().getFullYear()} HabitAI. Free forever.
            </p>
            <nav className="flex gap-4 text-xs text-neutral-500">
              <Link href="/login" className="hover:text-neutral-700">Sign in</Link>
              <Link href="/signup" className="hover:text-neutral-700">Sign up</Link>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}
