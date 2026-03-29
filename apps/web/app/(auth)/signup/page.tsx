"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import posthog from "posthog-js";
import { createClient } from "@/lib/supabase";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FormState {
  displayName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface FieldErrors {
  displayName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

// ---------------------------------------------------------------------------
// Google icon
// ---------------------------------------------------------------------------

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function validate(form: FormState): FieldErrors {
  const errors: FieldErrors = {};
  if (!form.displayName || form.displayName.trim().length < 2)
    errors.displayName = "Display name must be at least 2 characters.";
  if (!form.email || !/\S+@\S+\.\S+/.test(form.email))
    errors.email = "Please enter a valid email address.";
  if (!form.password || form.password.length < 8)
    errors.password = "Password must be at least 8 characters.";
  if (form.password !== form.confirmPassword)
    errors.confirmPassword = "Passwords don't match.";
  return errors;
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({
    displayName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  function field(key: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((f) => ({ ...f, [key]: e.target.value }));
      setFieldErrors((fe) => ({ ...fe, [key]: undefined }));
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);

    const errors = validate(form);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);
    try {
      // TODO: replace with API call — POST /api/auth/signup
      const supabase = createClient();
      const { data, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { data: { display_name: form.displayName.trim() } },
      });

      if (authError) {
        if (authError.message.toLowerCase().includes("already")) {
          setServerError("An account with this email already exists.");
        } else {
          setServerError(authError.message);
        }
        return;
      }

      if (data.user) {
        // Insert user profile row
        await supabase.from("users").upsert({
          id: data.user.id,
          email: form.email,
          display_name: form.displayName.trim(),
          onboarding_complete: false,
        });

        posthog.capture("user_signed_up", { method: "email" });
        router.push("/onboarding");
      }
    } catch {
      setServerError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignup() {
    setGoogleLoading(true);
    try {
      // TODO: replace with API call — POST /api/auth/oauth/google
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) {
        setServerError("Google sign-up failed. Please try again.");
        setGoogleLoading(false);
      }
    } catch {
      setServerError("Something went wrong. Please try again.");
      setGoogleLoading(false);
    }
  }

  return (
    <>
      <h1 className="mb-1 text-2xl font-bold text-neutral-900">
        Create your account
      </h1>
      <p className="mb-6 text-sm text-neutral-500">
        Free forever. No credit card required.
      </p>

      {/* Server error */}
      {serverError && (
        <div className="mb-4 rounded-lg bg-danger-50 px-4 py-3 text-sm text-danger-600 ring-1 ring-danger-400/30">
          {serverError}
        </div>
      )}

      {/* Google OAuth */}
      <button
        type="button"
        onClick={handleGoogleSignup}
        disabled={googleLoading || loading}
        className="mb-4 flex w-full items-center justify-center gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 shadow-sm transition-colors hover:bg-neutral-50 disabled:opacity-50"
      >
        <GoogleIcon />
        {googleLoading ? "Redirecting…" : "Continue with Google"}
      </button>

      {/* Divider */}
      <div className="relative mb-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-neutral-200" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-white px-2 text-neutral-400">or</span>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="displayName" className="mb-1.5 block text-sm font-medium text-neutral-700">
            Display name
          </label>
          <input
            id="displayName"
            type="text"
            autoComplete="name"
            required
            value={form.displayName}
            onChange={field("displayName")}
            className={`w-full rounded-xl border px-3.5 py-2.5 text-sm placeholder-neutral-400 shadow-sm outline-none transition-shadow focus:ring-2 focus:ring-brand-400/20 ${fieldErrors.displayName ? "border-danger-400" : "border-neutral-200 focus:border-brand-400"}`}
            placeholder="Your name"
          />
          {fieldErrors.displayName && <p className="mt-1 text-xs text-danger-600">{fieldErrors.displayName}</p>}
        </div>

        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-neutral-700">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={form.email}
            onChange={field("email")}
            className={`w-full rounded-xl border px-3.5 py-2.5 text-sm placeholder-neutral-400 shadow-sm outline-none transition-shadow focus:ring-2 focus:ring-brand-400/20 ${fieldErrors.email ? "border-danger-400" : "border-neutral-200 focus:border-brand-400"}`}
            placeholder="you@example.com"
          />
          {fieldErrors.email && <p className="mt-1 text-xs text-danger-600">{fieldErrors.email}</p>}
        </div>

        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-neutral-700">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            value={form.password}
            onChange={field("password")}
            className={`w-full rounded-xl border px-3.5 py-2.5 text-sm placeholder-neutral-400 shadow-sm outline-none transition-shadow focus:ring-2 focus:ring-brand-400/20 ${fieldErrors.password ? "border-danger-400" : "border-neutral-200 focus:border-brand-400"}`}
            placeholder="Min. 8 characters"
          />
          {fieldErrors.password && <p className="mt-1 text-xs text-danger-600">{fieldErrors.password}</p>}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-medium text-neutral-700">
            Confirm password
          </label>
          <input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            value={form.confirmPassword}
            onChange={field("confirmPassword")}
            className={`w-full rounded-xl border px-3.5 py-2.5 text-sm placeholder-neutral-400 shadow-sm outline-none transition-shadow focus:ring-2 focus:ring-brand-400/20 ${fieldErrors.confirmPassword ? "border-danger-400" : "border-neutral-200 focus:border-brand-400"}`}
            placeholder="Re-enter password"
          />
          {fieldErrors.confirmPassword && <p className="mt-1 text-xs text-danger-600">{fieldErrors.confirmPassword}</p>}
        </div>

        <button
          type="submit"
          disabled={loading || googleLoading}
          className="w-full rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {loading ? "Creating account…" : "Create free account"}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-neutral-500">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-brand-600 hover:text-brand-700">
          Sign in
        </Link>
      </p>
    </>
  );
}
