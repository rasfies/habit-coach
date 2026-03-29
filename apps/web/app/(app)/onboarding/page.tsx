"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import posthog from "posthog-js";
import { HabitForm, type HabitFormData } from "@/components/habits/habit-form";
import { AICoachMessage } from "@/components/ui/ai-coach-message";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CreatedHabit {
  id: string;
  name: string;
  icon: string;
}

type Step = 1 | 2 | 3 | 4;

// ---------------------------------------------------------------------------
// Step progress bar
// ---------------------------------------------------------------------------

function ProgressBar({ step }: { step: Step }) {
  const steps = [
    { label: "Welcome", num: 1 },
    { label: "Habits", num: 2 },
    { label: "Group", num: 3 },
    { label: "Ready", num: 4 },
  ];

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {steps.map((s, i) => (
          <React.Fragment key={s.num}>
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-all",
                  step > s.num
                    ? "bg-success-500 text-white"
                    : step === s.num
                    ? "bg-brand-600 text-white ring-4 ring-brand-100"
                    : "bg-neutral-200 text-neutral-500"
                )}
              >
                {step > s.num ? (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-4 w-4" aria-hidden="true">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  s.num
                )}
              </div>
              <span
                className={cn(
                  "text-xs font-medium",
                  step === s.num ? "text-brand-600" : "text-neutral-400"
                )}
              >
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={cn(
                  "h-0.5 flex-1 mx-2 rounded-full transition-all",
                  step > s.num ? "bg-success-400" : "bg-neutral-200"
                )}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 1 — Welcome
// ---------------------------------------------------------------------------

function Step1Welcome({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex flex-col items-center gap-6 py-4 text-center animate-[fade-up_300ms_ease-out]">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-brand-600 text-5xl shadow-lg">
        ✨
      </div>
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">
          Welcome to HabitAI
        </h1>
        <p className="mt-2 text-neutral-500 max-w-sm">
          You&apos;re about to build habits that actually stick — with AI coaching and real accountability.
        </p>
      </div>
      <div className="flex flex-col gap-2 w-full max-w-xs text-sm text-neutral-600">
        {[
          "Personalized AI coaching every day",
          "Track streaks with grace days",
          "Accountability groups that keep you honest",
        ].map((feat) => (
          <div key={feat} className="flex items-center gap-2.5 text-left">
            <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-success-100">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-3 w-3 text-success-600" aria-hidden="true">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            {feat}
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={onNext}
        className="w-full max-w-xs rounded-xl bg-brand-600 px-6 py-3 font-semibold text-white shadow-sm transition-colors hover:bg-brand-700"
      >
        Let&apos;s set up your habits →
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 2 — Add habits
// ---------------------------------------------------------------------------

function Step2Habits({
  onNext,
  onAddHabit,
  habits,
  loading,
  error,
}: {
  onNext: () => void;
  onAddHabit: (data: HabitFormData) => Promise<void>;
  habits: CreatedHabit[];
  loading: boolean;
  error: string | null;
}) {
  return (
    <div className="animate-[fade-up_300ms_ease-out]">
      <h2 className="mb-1 text-xl font-bold text-neutral-900">Add your habits</h2>
      <p className="mb-6 text-sm text-neutral-500">
        Start with 1–3 daily habits. You can add more later.
      </p>

      {/* Created habits */}
      {habits.length > 0 && (
        <div className="mb-5 space-y-2">
          {habits.map((h) => (
            <div
              key={h.id}
              className="flex items-center gap-3 rounded-xl bg-success-50 px-4 py-2.5 ring-1 ring-success-200"
            >
              <span className="text-xl">{h.icon}</span>
              <span className="text-sm font-medium text-success-700">{h.name}</span>
              <span className="ml-auto text-xs text-success-500">Added ✓</span>
            </div>
          ))}
        </div>
      )}

      {/* Add habit form — hidden when 3 habits already added */}
      {habits.length < 3 ? (
        <div className="rounded-xl border border-neutral-200 p-4">
          <p className="mb-3 text-xs font-medium uppercase tracking-wider text-neutral-400">
            Add habit {habits.length + 1} of 3
          </p>
          <HabitForm
            onSubmit={onAddHabit}
            submitLabel="Add habit"
            loading={loading}
            error={error}
          />
        </div>
      ) : (
        <p className="rounded-xl bg-highlight-50 px-4 py-3 text-sm text-highlight-700 ring-1 ring-highlight-200">
          🎉 You&apos;ve added 3 habits — that&apos;s the sweet spot to start!
        </p>
      )}

      <div className="mt-6 flex gap-3">
        {habits.length === 0 ? (
          <button
            type="button"
            onClick={onNext}
            className="text-sm text-neutral-400 hover:text-neutral-600 underline"
          >
            Skip for now
          </button>
        ) : (
          <button
            type="button"
            onClick={onNext}
            className="w-full rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700"
          >
            Continue with {habits.length} habit{habits.length !== 1 ? "s" : ""} →
          </button>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 3 — Group setup
// ---------------------------------------------------------------------------

function Step3Group({
  onNext,
}: {
  onNext: (action: "create" | "join" | "skip", data?: { name?: string; code?: string }) => Promise<void>;
}) {
  const [mode, setMode] = useState<"choose" | "create" | "join">("choose");
  const [groupName, setGroupName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!groupName.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await onNext("create", { name: groupName.trim() });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create group.");
    } finally {
      setLoading(false);
    }
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteCode.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await onNext("join", { code: inviteCode.trim().toUpperCase() });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid invite code.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="animate-[fade-up_300ms_ease-out]">
      <h2 className="mb-1 text-xl font-bold text-neutral-900">
        Join an accountability group
      </h2>
      <p className="mb-6 text-sm text-neutral-500">
        Groups make habits stick. Members see each other&apos;s streaks — so you&apos;re never just accountable to an algorithm.
      </p>

      {error && (
        <div className="mb-4 rounded-lg bg-danger-50 px-4 py-3 text-sm text-danger-600 ring-1 ring-danger-400/30">
          {error}
        </div>
      )}

      {mode === "choose" && (
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => setMode("create")}
            className="w-full flex items-center gap-4 rounded-xl border-2 border-brand-200 bg-brand-50 px-5 py-4 text-left transition-colors hover:border-brand-400 hover:bg-brand-100"
          >
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-brand-100 text-xl">
              🏠
            </div>
            <div>
              <p className="font-semibold text-neutral-900">Create a group</p>
              <p className="text-sm text-neutral-500">Name it and invite friends with a code</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setMode("join")}
            className="w-full flex items-center gap-4 rounded-xl border-2 border-neutral-200 bg-white px-5 py-4 text-left transition-colors hover:border-neutral-300 hover:bg-neutral-50"
          >
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-neutral-100 text-xl">
              🔗
            </div>
            <div>
              <p className="font-semibold text-neutral-900">Join with a code</p>
              <p className="text-sm text-neutral-500">Enter a 6-character invite code</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNext("skip")}
            className="w-full text-center py-2.5 text-sm text-neutral-400 hover:text-neutral-600"
          >
            Skip for now
          </button>
        </div>
      )}

      {mode === "create" && (
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label htmlFor="group-name" className="mb-1.5 block text-sm font-medium text-neutral-700">
              Group name
            </label>
            <input
              id="group-name"
              type="text"
              required
              maxLength={60}
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full rounded-xl border border-neutral-200 px-3.5 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20"
              placeholder="e.g. Morning Warriors, Study Buddies…"
              autoFocus
            />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setMode("choose")} className="flex-1 rounded-xl border border-neutral-200 px-4 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50">
              Back
            </button>
            <button type="submit" disabled={loading || !groupName.trim()} className="flex-1 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50">
              {loading ? "Creating…" : "Create group →"}
            </button>
          </div>
        </form>
      )}

      {mode === "join" && (
        <form onSubmit={handleJoin} className="space-y-4">
          <div>
            <label htmlFor="invite-code" className="mb-1.5 block text-sm font-medium text-neutral-700">
              Invite code
            </label>
            <input
              id="invite-code"
              type="text"
              required
              maxLength={6}
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              className="w-full rounded-xl border border-neutral-200 px-3.5 py-2.5 text-center font-mono text-2xl font-bold tracking-widest uppercase outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20"
              placeholder="ABC123"
              autoFocus
            />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setMode("choose")} className="flex-1 rounded-xl border border-neutral-200 px-4 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50">
              Back
            </button>
            <button type="submit" disabled={loading || inviteCode.length !== 6} className="flex-1 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50">
              {loading ? "Joining…" : "Join group →"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 4 — AI coach ready
// ---------------------------------------------------------------------------

function Step4Ready({
  habitNames,
  onFinish,
}: {
  habitNames: string[];
  onFinish: () => void;
}) {
  // TODO: replace with API call — GET /api/coach/message/today
  const mockMessage =
    habitNames.length > 0
      ? `Welcome to HabitAI! You've committed to ${habitNames.length} habit${habitNames.length !== 1 ? "s" : ""}: ${habitNames.join(", ")}. I'll be here every day with personalized coaching to help you build momentum. Let's start strong — your first check-in awaits.`
      : "Welcome to HabitAI! I'm your personal habit coach. I'll be checking in with you every day with personalized guidance. Ready to start your journey?";

  return (
    <div className="flex flex-col gap-6 animate-[fade-up_300ms_ease-out]">
      <div className="text-center">
        <div className="mb-3 text-5xl">🎉</div>
        <h2 className="text-xl font-bold text-neutral-900">Your AI coach is ready!</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Here&apos;s your Day 1 coaching message:
        </p>
      </div>

      <AICoachMessage
        message={mockMessage}
        timestamp={new Date()}
        type="daily"
      />

      <button
        type="button"
        onClick={onFinish}
        className="w-full rounded-xl bg-brand-600 px-4 py-3 font-semibold text-white shadow-sm transition-colors hover:bg-brand-700"
      >
        Go to Dashboard →
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Onboarding page
// ---------------------------------------------------------------------------

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [habits, setHabits] = useState<CreatedHabit[]>([]);
  const [habitLoading, setHabitLoading] = useState(false);
  const [habitError, setHabitError] = useState<string | null>(null);

  function advance(s: Step) {
    setStep(s);
    posthog.capture("onboarding_step_completed", { step: s - 1 });
  }

  // -- Add habit
  async function handleAddHabit(data: HabitFormData) {
    setHabitLoading(true);
    setHabitError(null);
    try {
      // TODO: replace with API call — POST /api/habits
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const res = await fetch("/api/habits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          icon: data.icon,
          reminder_time: data.reminderTime || null,
          frequency: "daily",
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message ?? "Failed to create habit.");
      }

      const created = await res.json();
      setHabits((h) => [...h, { id: created.id, name: data.name, icon: data.icon }]);
      posthog.capture("habit_created", { habit_name: data.name, source: "onboarding" });
    } catch (err) {
      setHabitError(err instanceof Error ? err.message : "Failed to create habit.");
    } finally {
      setHabitLoading(false);
    }
  }

  // -- Group action
  async function handleGroupAction(
    action: "create" | "join" | "skip",
    data?: { name?: string; code?: string }
  ) {
    if (action !== "skip") {
      // TODO: replace with API calls — POST /api/groups or POST /api/groups/join
      if (action === "create" && data?.name) {
        const res = await fetch("/api/groups", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: data.name }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message ?? "Failed to create group.");
        }
        posthog.capture("group_created", { source: "onboarding" });
      } else if (action === "join" && data?.code) {
        const res = await fetch("/api/groups/join", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ invite_code: data.code }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message ?? "Invalid invite code.");
        }
        posthog.capture("group_joined", { source: "onboarding" });
      }
    }
    advance(4);
  }

  // -- Finish onboarding
  async function handleFinish() {
    try {
      // TODO: replace with API call — PATCH /api/users/me/onboarding
      await fetch("/api/users/me/onboarding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ onboarding_complete: true }),
      });
      posthog.capture("onboarding_step_completed", { step: 4 });
    } finally {
      router.push("/dashboard");
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-brand-50 via-white to-highlight-50 px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Progress bar */}
        <ProgressBar step={step} />

        {/* Card */}
        <div className="rounded-2xl bg-white p-6 shadow-lg ring-1 ring-neutral-200 md:p-8">
          {step === 1 && <Step1Welcome onNext={() => advance(2)} />}
          {step === 2 && (
            <Step2Habits
              onNext={() => advance(3)}
              onAddHabit={handleAddHabit}
              habits={habits}
              loading={habitLoading}
              error={habitError}
            />
          )}
          {step === 3 && <Step3Group onNext={handleGroupAction} />}
          {step === 4 && (
            <Step4Ready
              habitNames={habits.map((h) => h.name)}
              onFinish={handleFinish}
            />
          )}
        </div>
      </div>
    </div>
  );
}
