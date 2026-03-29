/**
 * Supabase Edge Function: streak-audit
 * Runtime: Deno
 *
 * Schedule: daily at 00:05 UTC via pg_cron (runs after midnight rolls over)
 *
 * For each active user + habit:
 * 1. Fetches all habit_logs ordered by log_date
 * 2. Recalculates streak using the same grace-day logic as the app
 * 3. Resets grace_days_used_this_week to 0 on Mondays
 * 4. Updates streaks table
 * 5. Detects milestones and queues milestone messages if threshold just crossed
 *
 * This is the authoritative streak recalculation — the app-level calculation
 * on each log event is optimistic; this is the ground truth.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

// ─── Pure streak calculation (mirrors apps/web/lib/streak.ts) ───

interface HabitLog {
  log_date: string;
  completed: boolean;
}

function toDateStr(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getMondayOfWeek(d: Date): Date {
  const copy = new Date(d);
  const day = copy.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setUTCDate(copy.getUTCDate() + diff);
  return copy;
}

function diffDays(a: Date, b: Date): number {
  return Math.round((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24));
}

interface StreakResult {
  current: number;
  longest: number;
  graceDaysUsed: number;
  lastCompletedDate: string | null;
  lastStreakReset: string | null;
}

function calculateStreak(logs: HabitLog[], today: Date): StreakResult {
  const completed = logs.filter((l) => l.completed);
  if (completed.length === 0) {
    return {
      current: 0,
      longest: 0,
      graceDaysUsed: 0,
      lastCompletedDate: null,
      lastStreakReset: null,
    };
  }

  const uniqueDates = [
    ...new Set(completed.map((l) => l.log_date)),
  ].sort((a, b) => (a > b ? -1 : 1));

  const ascending = [...uniqueDates].reverse();

  // Longest streak
  let longestStreak = 1;
  {
    const weekGrace = new Map<string, boolean>();
    let streak = 1;
    for (let i = 1; i < ascending.length; i++) {
      const prev = new Date(`${ascending[i - 1]}T00:00:00.000Z`);
      const curr = new Date(`${ascending[i]}T00:00:00.000Z`);
      const gap = diffDays(curr, prev);
      if (gap === 1) {
        streak++;
      } else if (gap === 2) {
        const wk = toDateStr(getMondayOfWeek(prev));
        if (!weekGrace.get(wk)) {
          weekGrace.set(wk, true);
          streak++;
        } else {
          longestStreak = Math.max(longestStreak, streak);
          streak = 1;
          weekGrace.clear();
        }
      } else {
        longestStreak = Math.max(longestStreak, streak);
        streak = 1;
        weekGrace.clear();
      }
    }
    longestStreak = Math.max(longestStreak, streak);
  }

  // Current streak
  const todayStr = toDateStr(today);
  const mostRecent = uniqueDates[0];
  const mostRecentDate = new Date(`${mostRecent}T00:00:00.000Z`);
  const todayDate = new Date(`${todayStr}T00:00:00.000Z`);
  const gapFromToday = diffDays(todayDate, mostRecentDate);

  let currentStreak = 0;
  let lastStreakReset: string | null = null;
  let graceDaysThisWeek = 0;

  if (gapFromToday > 2) {
    currentStreak = 0;
    lastStreakReset = mostRecent;
  } else {
    const weekGrace = new Map<string, boolean>();
    let streak = 0;
    let broken = false;

    if (gapFromToday <= 1) {
      streak = 1;
    } else {
      // gap === 2
      const wk = toDateStr(getMondayOfWeek(mostRecentDate));
      if (!weekGrace.get(wk)) {
        weekGrace.set(wk, true);
        streak = 1;
      } else {
        broken = true;
      }
    }

    if (!broken) {
      for (let i = 0; i < uniqueDates.length - 1; i++) {
        const curr = new Date(`${uniqueDates[i]}T00:00:00.000Z`);
        const next = new Date(`${uniqueDates[i + 1]}T00:00:00.000Z`);
        const gap = diffDays(curr, next);

        if (gap === 1) {
          streak++;
        } else if (gap === 2) {
          const wk = toDateStr(getMondayOfWeek(next));
          if (!weekGrace.get(wk)) {
            weekGrace.set(wk, true);
            streak++;
          } else {
            lastStreakReset = uniqueDates[i + 1];
            break;
          }
        } else {
          lastStreakReset = uniqueDates[i + 1];
          break;
        }
      }
    } else {
      lastStreakReset = mostRecent;
    }

    currentStreak = broken ? 0 : streak;
    const thisWeekKey = toDateStr(getMondayOfWeek(todayDate));
    graceDaysThisWeek = weekGrace.get(thisWeekKey) ? 1 : 0;
  }

  const isMonday = today.getUTCDay() === 1;
  if (isMonday) {
    graceDaysThisWeek = 0; // reset on Mondays
  }

  return {
    current: currentStreak,
    longest: Math.max(longestStreak, currentStreak),
    graceDaysUsed: graceDaysThisWeek,
    lastCompletedDate: uniqueDates[0] ?? null,
    lastStreakReset,
  };
}

const MILESTONES = [3, 7, 14, 30];

Deno.serve(async (_req) => {
  try {
    const today = new Date();
    const todayStr = toDateStr(today);

    // Fetch all habit-streak pairs
    const { data: streaks, error: streaksError } = await supabase
      .from("streaks")
      .select("id, habit_id, user_id, current_streak, longest_streak");

    if (streaksError) throw streaksError;

    let updated = 0;
    let milestones = 0;
    let errors = 0;

    for (const streak of streaks ?? []) {
      try {
        const { data: logs } = await supabase
          .from("habit_logs")
          .select("log_date, completed")
          .eq("habit_id", streak.habit_id)
          .order("log_date", { ascending: false });

        const result = calculateStreak(logs ?? [], today);
        const previousStreak = streak.current_streak;

        await supabase
          .from("streaks")
          .update({
            current_streak: result.current,
            longest_streak: result.longest,
            grace_days_used_this_week: result.graceDaysUsed,
            last_completed_date: result.lastCompletedDate,
            last_streak_reset: result.lastStreakReset,
          })
          .eq("id", streak.id);

        updated++;

        // Detect milestone crossing
        const crossedMilestone = MILESTONES.find(
          (m) => result.current === m && previousStreak < m
        );

        if (crossedMilestone) {
          const messageType =
            crossedMilestone === 3
              ? "streak_3"
              : crossedMilestone === 7
              ? "streak_7"
              : "daily";

          // Check if milestone message already exists for today
          const { data: existingMsg } = await supabase
            .from("ai_messages")
            .select("id")
            .eq("user_id", streak.user_id)
            .eq("message_date", todayStr)
            .eq("message_type", messageType)
            .single();

          if (!existingMsg) {
            // Queue milestone message generation via the generate endpoint
            // In production: call the Next.js API or generate inline
            console.log(
              `Milestone ${crossedMilestone} for user ${streak.user_id}, habit ${streak.habit_id}`
            );
            milestones++;
          }
        }
      } catch (err) {
        console.error(`Error auditing streak ${streak.id}:`, err);
        errors++;
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        updated,
        milestones,
        errors,
        date: todayStr,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("streak-audit fatal error:", err);
    return new Response(
      JSON.stringify({ ok: false, error: String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
