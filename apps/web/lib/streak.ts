import type { HabitLog } from "@habit-coach/db";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface StreakResult {
  current: number;
  longest: number;
  graceDaysUsed: number;
  lastCompletedDate: string | null;
  lastStreakReset: string | null;
}

// ─────────────────────────────────────────────
// Date utilities (pure — no timezone side effects)
// ─────────────────────────────────────────────

function toDateStr(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseDate(dateStr: string): Date {
  // Parse as UTC midnight to avoid timezone shifting
  return new Date(`${dateStr}T00:00:00.000Z`);
}

function diffDays(a: Date, b: Date): number {
  return Math.round((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Returns the Monday of the ISO week that contains the given date (UTC).
 */
function getMondayOfWeek(d: Date): Date {
  const copy = new Date(d);
  const day = copy.getUTCDay(); // 0=Sun, 1=Mon, ...
  const diff = day === 0 ? -6 : 1 - day; // shift to Monday
  copy.setUTCDate(copy.getUTCDate() + diff);
  return copy;
}

// ─────────────────────────────────────────────
// Core streak calculation
// ─────────────────────────────────────────────

/**
 * Calculate current and longest streaks from a set of habit logs.
 *
 * Grace day rule:
 *   - At most 1 grace day per calendar week (Monday–Sunday, UTC)
 *   - A grace day allows exactly 1 skipped day within a streak without breaking it
 *   - The streak count does NOT increment for a grace day (you didn't actually complete the habit)
 *   - grace_days_used_this_week is scoped to the current week at call time
 *
 * @param logs   All habit_log rows for this habit, any order (we sort internally)
 * @param today  Reference "today" date (UTC midnight). Defaults to actual today.
 */
export function calculateStreak(
  logs: HabitLog[],
  today: Date = new Date()
): StreakResult {
  if (logs.length === 0) {
    return {
      current: 0,
      longest: 0,
      graceDaysUsed: 0,
      lastCompletedDate: null,
      lastStreakReset: null,
    };
  }

  // Deduplicate and sort descending (most recent first)
  const uniqueDates = [
    ...new Set(logs.filter((l) => l.completed).map((l) => l.log_date)),
  ].sort((a, b) => (a > b ? -1 : 1));

  if (uniqueDates.length === 0) {
    return {
      current: 0,
      longest: 0,
      graceDaysUsed: 0,
      lastCompletedDate: null,
      lastStreakReset: null,
    };
  }

  const todayStr = toDateStr(today);
  const mostRecentDate = uniqueDates[0];

  // If the most recent log is more than 2 days ago and we can't use a grace day
  // the streak is already broken — we need to walk forward from most recent log.
  // We calculate all streaks by walking from the oldest log forward.

  // Walk ascending (oldest first) to find all streak segments
  const ascending = [...uniqueDates].reverse();

  // Track streaks per ISO week for grace days (week-scoped)
  const weekGraceDayUsed = new Map<string, boolean>(); // weekStart -> used

  let currentStreak = 0;
  let longestStreak = 0;
  let graceDaysThisWeek = 0;
  let lastStreakReset: string | null = null;
  let lastCompletedDate: string | null = mostRecentDate;

  // We'll compute the current streak by walking backward from today
  // and separately compute longest by walking all logs forward.

  // ─── Longest streak (walk ascending, no today constraint) ───
  {
    const weekGrace = new Map<string, boolean>();
    let streak = 1;
    let best = 1;

    for (let i = 1; i < ascending.length; i++) {
      const prev = parseDate(ascending[i - 1]);
      const curr = parseDate(ascending[i]);
      const gap = diffDays(curr, prev);

      if (gap === 1) {
        streak++;
      } else if (gap === 2) {
        // Possible grace day
        const weekKey = toDateStr(getMondayOfWeek(prev));
        if (!weekGrace.get(weekKey)) {
          weekGrace.set(weekKey, true);
          streak++; // count the actual completion, not the grace day
        } else {
          // Grace already used this week — streak broken
          if (streak > best) best = streak;
          streak = 1;
          weekGrace.clear();
        }
      } else {
        // Gap > 2: streak broken
        if (streak > best) best = streak;
        streak = 1;
        weekGrace.clear();
      }
    }

    longestStreak = Math.max(best, streak);
  }

  // ─── Current streak (walk backward from today) ───
  {
    // The most recent log must be today or yesterday (or the day before
    // if a grace day bridges the gap)
    const todayDate = parseDate(todayStr);
    const mostRecentParsed = parseDate(mostRecentDate);
    const gapFromToday = diffDays(todayDate, mostRecentParsed);

    if (gapFromToday > 2) {
      // More than 2 days since last log — streak is 0 regardless of grace days
      currentStreak = 0;
      lastStreakReset = mostRecentDate;
    } else {
      // Walk descending dates and count streak
      // Reset per-week grace tracking keyed to week start
      const activeWeekGrace = new Map<string, boolean>();

      let streak = 0;
      let broken = false;
      let usedGraceDayCount = 0;

      // Seed: check if most recent date is today or yesterday
      // (gap 0 or 1 is fine; gap 2 only if grace day available)
      if (gapFromToday === 0) {
        streak = 1;
      } else if (gapFromToday === 1) {
        streak = 1; // yesterday completed, today not yet — streak lives
      } else if (gapFromToday === 2) {
        // Need grace day for the skipped day (yesterday)
        const weekKey = toDateStr(getMondayOfWeek(mostRecentParsed));
        if (!activeWeekGrace.get(weekKey)) {
          activeWeekGrace.set(weekKey, true);
          usedGraceDayCount++;
          streak = 1; // still alive; grace day bridged
        } else {
          broken = true;
        }
      }

      if (!broken) {
        // Walk backward through sorted unique dates
        for (let i = 0; i < uniqueDates.length - 1; i++) {
          const curr = parseDate(uniqueDates[i]);
          const next = parseDate(uniqueDates[i + 1]); // next = older
          const gap = diffDays(curr, next);

          if (gap === 1) {
            streak++;
          } else if (gap === 2) {
            const weekKey = toDateStr(getMondayOfWeek(next));
            if (!activeWeekGrace.get(weekKey)) {
              activeWeekGrace.set(weekKey, true);
              usedGraceDayCount++;
              streak++; // count the older completion day
            } else {
              // Grace exhausted for this week — streak breaks here
              lastStreakReset = uniqueDates[i + 1];
              break;
            }
          } else {
            // Gap > 2: streak broken
            lastStreakReset = uniqueDates[i + 1];
            break;
          }
        }
      } else {
        currentStreak = 0;
        lastStreakReset = mostRecentDate;
      }

      currentStreak = broken ? 0 : streak;

      // Grace days used THIS current week (Monday–Sunday)
      const thisWeekKey = toDateStr(getMondayOfWeek(todayDate));
      graceDaysThisWeek = activeWeekGrace.get(thisWeekKey) ? 1 : 0;
    }
  }

  if (currentStreak > longestStreak) longestStreak = currentStreak;

  return {
    current: currentStreak,
    longest: longestStreak,
    graceDaysUsed: graceDaysThisWeek,
    lastCompletedDate: mostRecentDate,
    lastStreakReset,
  };
}

// ─────────────────────────────────────────────
// Grace day helpers
// ─────────────────────────────────────────────

/**
 * Returns true if adding a log for `date` would consume the grace day
 * (i.e., the user skipped exactly one day and has not yet used a grace day this week).
 */
export function isGraceDay(date: Date, logs: HabitLog[]): boolean {
  const completedDates = logs
    .filter((l) => l.completed)
    .map((l) => l.log_date)
    .sort((a, b) => (a > b ? -1 : 1));

  if (completedDates.length === 0) return false;

  const mostRecent = parseDate(completedDates[0]);
  const gap = diffDays(date, mostRecent);
  if (gap !== 2) return false;

  // Check if the week already has a grace day used
  const weekKey = toDateStr(getMondayOfWeek(mostRecent));
  const gracedThisWeek = logs.some(
    (l) =>
      l.is_grace_day &&
      toDateStr(getMondayOfWeek(parseDate(l.log_date))) === weekKey
  );

  return !gracedThisWeek;
}

// ─────────────────────────────────────────────
// Milestone helpers
// ─────────────────────────────────────────────

const MILESTONES = [3, 7, 14, 30] as const;
type Milestone = (typeof MILESTONES)[number];

export function isMilestone(streak: number): boolean {
  return MILESTONES.includes(streak as Milestone);
}

export function getMilestoneLabel(streak: number): string | null {
  if (!isMilestone(streak)) return null;
  switch (streak) {
    case 3:
      return "3-Day Streak";
    case 7:
      return "Week Warrior";
    case 14:
      return "Two-Week Champion";
    case 30:
      return "Month Master";
    default:
      return null;
  }
}
