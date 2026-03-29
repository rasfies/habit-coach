"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import posthog from "posthog-js";
import { ProgressRing } from "@/components/ui/progress-ring";
import { AICoachMessage } from "@/components/ui/ai-coach-message";
import { HabitCard } from "@/components/ui/habit-card";
import { StreakBadge } from "@/components/ui/streak-badge";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Habit {
  id: string;
  name: string;
  icon: string;
  streakCount: number;
  checkedToday: boolean;
}

interface CoachMessage {
  id: string;
  content: string;
  message_type: "daily" | "day1_welcome" | "streak_3" | "streak_7";
  created_at: string;
}

interface QuickStats {
  bestStreak: number;
  bestHabitName: string;
  completedThisWeek: number;
  groupRank: number | null;
}

// ---------------------------------------------------------------------------
// Mock data — TODO: replace with API calls
// ---------------------------------------------------------------------------

const MOCK_HABITS: Habit[] = [
  { id: "1", name: "Morning Run", icon: "🏃", streakCount: 7, checkedToday: false },
  { id: "2", name: "Read 20 pages", icon: "📚", streakCount: 3, checkedToday: true },
  { id: "3", name: "Meditate 10 min", icon: "🧘", streakCount: 14, checkedToday: false },
];

const MOCK_COACH: CoachMessage = {
  id: "mock-1",
  content:
    "You're on a 7-day streak for Morning Run — that's serious momentum. Research shows habits become automatic around day 21, so you're well on your way. Today, focus on consistency over perfection. Even 10 minutes counts.",
  message_type: "daily",
  created_at: new Date().toISOString(),
};

const MOCK_STATS: QuickStats = {
  bestStreak: 14,
  bestHabitName: "Meditate 10 min",
  completedThisWeek: 12,
  groupRank: 2,
};

// ---------------------------------------------------------------------------
// Greeting
// ---------------------------------------------------------------------------

function getGreeting(name: string): string {
  const hour = new Date().getHours();
  if (hour < 12) return `Good morning, ${name}`;
  if (hour < 17) return `Good afternoon, ${name}`;
  return `Good evening, ${name}`;
}

// ---------------------------------------------------------------------------
// Quick stats row
// ---------------------------------------------------------------------------

function QuickStatsRow({ stats }: { stats: QuickStats }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="rounded-xl bg-white px-3 py-3.5 shadow-sm ring-1 ring-neutral-100 text-center">
        <p className="font-mono text-2xl font-bold text-highlight-500">{stats.bestStreak}</p>
        <p className="mt-0.5 text-xs text-neutral-500">Best streak</p>
        <p className="mt-0.5 truncate text-xs font-medium text-neutral-700">{stats.bestHabitName}</p>
      </div>
      <div className="rounded-xl bg-white px-3 py-3.5 shadow-sm ring-1 ring-neutral-100 text-center">
        <p className="font-mono text-2xl font-bold text-brand-600">{stats.completedThisWeek}</p>
        <p className="mt-0.5 text-xs text-neutral-500">This week</p>
        <p className="mt-0.5 text-xs font-medium text-neutral-700">completions</p>
      </div>
      <div className="rounded-xl bg-white px-3 py-3.5 shadow-sm ring-1 ring-neutral-100 text-center">
        {stats.groupRank ? (
          <>
            <p className="font-mono text-2xl font-bold text-success-600">#{stats.groupRank}</p>
            <p className="mt-0.5 text-xs text-neutral-500">Group rank</p>
            <Link href="/groups" className="mt-0.5 text-xs font-medium text-brand-600 hover:underline">
              View group
            </Link>
          </>
        ) : (
          <>
            <p className="text-xl">👥</p>
            <p className="mt-0.5 text-xs text-neutral-500">No group yet</p>
            <Link href="/groups" className="mt-0.5 text-xs font-medium text-brand-600 hover:underline">
              Join one
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyHabitsState() {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-neutral-200 px-6 py-12 text-center">
      <div className="text-5xl">🌱</div>
      <div>
        <p className="font-semibold text-neutral-700">No habits yet</p>
        <p className="mt-1 text-sm text-neutral-500">
          Add your first habit to start building momentum.
        </p>
      </div>
      <Link
        href="/habits"
        className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700"
      >
        Add your first habit
      </Link>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Dashboard page
// ---------------------------------------------------------------------------

export default function DashboardPage() {
  const [habits, setHabits] = useState<Habit[]>(MOCK_HABITS);
  const [coachMsg, setCoachMsg] = useState<CoachMessage | null>(null);
  const [coachPolling, setCoachPolling] = useState(false);
  const [loadingHabits, setLoadingHabits] = useState<Set<string>>(new Set());
  const [userName] = useState("Alex"); // TODO: fetch from session

  // -- Load habits
  useEffect(() => {
    async function loadHabits() {
      try {
        // TODO: replace with API call — GET /api/habits
        // const res = await fetch("/api/habits");
        // const data = await res.json();
        // setHabits(data.habits);
        setHabits(MOCK_HABITS);
      } catch {
        // use mock data on error
      }
    }
    loadHabits();
  }, []);

  // -- Load coach message
  const loadCoachMessage = useCallback(async () => {
    try {
      // TODO: replace with API call — GET /api/coach/message/today
      // const res = await fetch("/api/coach/message/today");
      // if (res.status === 202) { start polling }
      // const data = await res.json();
      setCoachMsg(MOCK_COACH);
      posthog.capture("coaching_message_viewed", { type: "daily" });
    } catch {
      // silent fail
    }
  }, []);

  useEffect(() => {
    loadCoachMessage();
  }, [loadCoachMessage]);

  // -- Toggle check
  async function handleToggleCheck(id: string) {
    const habit = habits.find((h) => h.id === id);
    if (!habit || habit.checkedToday) return;

    setLoadingHabits((prev) => new Set(prev).add(id));
    // Optimistic update
    setHabits((prev) =>
      prev.map((h) =>
        h.id === id
          ? { ...h, checkedToday: true, streakCount: h.streakCount + 1 }
          : h
      )
    );

    try {
      // TODO: replace with API call — POST /api/habits/:id/log
      // const res = await fetch(`/api/habits/${id}/log`, { method: "POST", ... });
      // const data = await res.json();
      // if (data.streak_milestone) trigger celebration
      posthog.capture("habit_logged", { habit_id: id });
      await new Promise((r) => setTimeout(r, 400)); // simulate network
    } catch {
      // Revert on failure
      setHabits((prev) =>
        prev.map((h) =>
          h.id === id
            ? { ...h, checkedToday: false, streakCount: h.streakCount - 1 }
            : h
        )
      );
    } finally {
      setLoadingHabits((prev) => {
        const s = new Set(prev);
        s.delete(id);
        return s;
      });
    }
  }

  const completed = habits.filter((h) => h.checkedToday).length;
  const total = habits.length;
  const allDone = completed === total && total > 0;

  const messageType =
    coachMsg?.message_type === "streak_3" || coachMsg?.message_type === "streak_7"
      ? "milestone"
      : "daily";

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 md:px-6 md:py-8">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">
            {getGreeting(userName)} 👋
          </h1>
          <p className="mt-0.5 text-sm text-neutral-500">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>

        {/* Progress ring */}
        <ProgressRing completed={completed} total={total} size={80} strokeWidth={7} />
      </div>

      {/* All done banner */}
      {allDone && (
        <div className="mb-6 rounded-xl bg-success-50 px-4 py-3 text-sm font-medium text-success-700 ring-1 ring-success-200 animate-[fade-up_300ms_ease-out]">
          🎉 You&apos;ve completed all your habits today! Amazing work.
        </div>
      )}

      {/* AI coach message */}
      {coachMsg && (
        <div className="mb-6">
          <AICoachMessage
            message={coachMsg.content}
            timestamp={new Date(coachMsg.created_at)}
            type={messageType}
          />
        </div>
      )}

      {/* Quick stats */}
      <div className="mb-6">
        <QuickStatsRow stats={MOCK_STATS} />
      </div>

      {/* Habits list */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-neutral-800">
            Today&apos;s habits
            {total > 0 && (
              <span className="ml-2 font-mono text-sm font-normal text-neutral-400">
                {completed}/{total}
              </span>
            )}
          </h2>
          <Link
            href="/habits"
            className="text-sm font-medium text-brand-600 hover:text-brand-700"
          >
            Manage
          </Link>
        </div>

        {habits.length === 0 ? (
          <EmptyHabitsState />
        ) : (
          <div className="space-y-3" role="list" aria-label="Today's habits">
            {habits.map((habit) => (
              <div key={habit.id} role="listitem">
                <HabitCard
                  id={habit.id}
                  name={habit.name}
                  icon={habit.icon}
                  streakCount={habit.streakCount}
                  checkedToday={habit.checkedToday}
                  onToggleCheck={handleToggleCheck}
                  disabled={loadingHabits.has(habit.id)}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
