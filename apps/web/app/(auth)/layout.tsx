import React from "react";
import Link from "next/link";

/**
 * Auth layout — centred card, HabitAI logo + tagline.
 * Wraps /login and /signup.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-brand-50 via-white to-highlight-50 px-4 py-12">
      {/* Logo + tagline */}
      <div className="mb-8 flex flex-col items-center gap-2 text-center">
        <Link href="/" className="flex items-center gap-2 group">
          {/* Icon mark */}
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white shadow-md transition-transform group-hover:scale-105">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-6 w-6"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M9 4.5a.75.75 0 0 1 .721.544l.813 2.846a3.75 3.75 0 0 0 2.576 2.576l2.846.813a.75.75 0 0 1 0 1.442l-2.846.813a3.75 3.75 0 0 0-2.576 2.576l-.813 2.846a.75.75 0 0 1-1.442 0l-.813-2.846a3.75 3.75 0 0 0-2.576-2.576l-2.846-.813a.75.75 0 0 1 0-1.442l2.846-.813A3.75 3.75 0 0 0 7.466 7.89l.813-2.846A.75.75 0 0 1 9 4.5Z"
                clipRule="evenodd"
              />
              <path d="M18 1.5a.75.75 0 0 1 .728.568l.258 1.036c.236.94.97 1.674 1.91 1.91l1.036.258a.75.75 0 0 1 0 1.456l-1.036.258a2.625 2.625 0 0 0-1.91 1.91l-.258 1.036a.75.75 0 0 1-1.456 0l-.258-1.036a2.625 2.625 0 0 0-1.91-1.91l-1.036-.258a.75.75 0 0 1 0-1.456l1.036-.258a2.625 2.625 0 0 0 1.91-1.91l.258-1.036A.75.75 0 0 1 18 1.5Z" />
            </svg>
          </div>
          <span className="text-2xl font-bold text-neutral-900 tracking-tight">
            HabitAI
          </span>
        </Link>
        <p className="text-sm font-medium text-neutral-500">
          Build habits. Together.
        </p>
      </div>

      {/* Card */}
      <div className="w-full max-w-md rounded-2xl bg-white px-8 py-8 shadow-lg ring-1 ring-neutral-200">
        {children}
      </div>

      {/* Footer */}
      <p className="mt-6 text-xs text-neutral-400">
        Free forever · No credit card required
      </p>
    </div>
  );
}
