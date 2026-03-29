"use client";

import React, { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email,
        { redirectTo: `${window.location.origin}/auth/callback?next=/settings` }
      );
      if (resetError) throw resetError;
      setSent(true);
    } catch {
      setError("Failed to send reset email. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <h1 className="mb-1 text-2xl font-bold text-neutral-900">Reset your password</h1>
      <p className="mb-6 text-sm text-neutral-500">
        Enter your email and we&apos;ll send you a reset link.
      </p>

      {sent ? (
        <div className="flex flex-col items-center gap-4 text-center py-4">
          <div className="text-4xl">📧</div>
          <p className="font-semibold text-neutral-800">Check your inbox</p>
          <p className="text-sm text-neutral-500">
            We&apos;ve sent a reset link to <strong>{email}</strong>.
          </p>
          <Link href="/login" className="text-sm font-medium text-brand-600 hover:text-brand-700">
            Back to sign in
          </Link>
        </div>
      ) : (
        <>
          {error && (
            <div className="mb-4 rounded-lg bg-danger-50 px-4 py-3 text-sm text-danger-600 ring-1 ring-danger-400/30">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-neutral-700">
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-neutral-200 px-3.5 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20"
                placeholder="you@example.com"
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {loading ? "Sending…" : "Send reset link"}
            </button>
          </form>
          <p className="mt-5 text-center text-sm text-neutral-500">
            <Link href="/login" className="font-medium text-brand-600 hover:text-brand-700">
              Back to sign in
            </Link>
          </p>
        </>
      )}
    </>
  );
}
