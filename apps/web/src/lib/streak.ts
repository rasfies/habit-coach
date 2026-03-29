// src/lib/streak.ts
// Pure streak calculation logic — no DB dependencies.
// Used by: API routes, streak-audit Edge Function (Deno mirror in supabase/functions/).
// The Deno edge function carries a copy to avoid cross-runtime imports.

export const MAX_GRACE_DAYS_PER_WEEK = 1

export const STREAK_MILESTONES = [3, 7, 14, 30, 60, 90, 180, 365] as const
export type StreakMilestone = (typeof STREAK_MILESTONES)[number]

export interface StreakResult {
  currentStreak: number
  longestStreak: number
  graceDaysUsed: number
  lastLoggedDate: string | null
  milestoneReached: StreakMilestone | null
}

function toDate(s: string): Date {
  return new Date(s + 'T00:00:00Z')
}

function diffDays(earlier: string, later: string): number {
  return Math.round(
    (toDate(later).getTime() - toDate(earlier).getTime()) / (1000 * 60 * 60 * 24),
  )
}

/**
 * Calculate the current streak from a list of log dates.
 *
 * @param logDates     Array of YYYY-MM-DD date strings when the habit was logged.
 * @param today        Today's date as YYYY-MM-DD.
 * @param graceUsed    Grace days already used this week (0 or 1; resets every Monday).
 * @param prevLongest  Previous longest streak (from DB) — ensures we never downgrade it.
 */
export function calculateStreak(
  logDates: string[],
  today: string,
  graceUsed: number = 0,
  prevLongest: number = 0,
): StreakResult {
  if (logDates.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: prevLongest,
      graceDaysUsed: graceUsed,
      lastLoggedDate: null,
      milestoneReached: null,
    }
  }

  // Deduplicate and sort ascending
  const sorted = [...new Set(logDates)].sort()
  const lastLog = sorted[sorted.length - 1]
  const todayDiff = diffDays(lastLog, today)

  // Helper: compute the longest run in an array of sorted dates (no grace)
  function longestRun(dates: string[]): number {
    if (dates.length === 0) return 0
    let best = 1
    let run = 1
    for (let i = 1; i < dates.length; i++) {
      if (diffDays(dates[i - 1], dates[i]) === 1) {
        run++
        best = Math.max(best, run)
      } else {
        run = 1
      }
    }
    return best
  }

  // If last log is more than 2 days ago (gap too large even with one grace day), streak is 0
  if (todayDiff > 2) {
    return {
      currentStreak: 0,
      longestStreak: Math.max(prevLongest, longestRun(sorted)),
      graceDaysUsed: graceUsed,
      lastLoggedDate: lastLog,
      milestoneReached: null,
    }
  }

  // Walk backwards through sorted logs to count the current streak
  let currentStreak = 1
  let graceDaysUsed = graceUsed

  for (let i = sorted.length - 2; i >= 0; i--) {
    const gap = diffDays(sorted[i], sorted[i + 1])

    if (gap === 1) {
      // Consecutive day
      currentStreak++
    } else if (gap === 2 && graceDaysUsed < MAX_GRACE_DAYS_PER_WEEK) {
      // One missed day — apply grace
      graceDaysUsed++
      currentStreak++
    } else {
      // Gap too large, or grace exhausted — streak stops
      break
    }
  }

  // If today is not logged AND the gap from lastLog to today uses up available grace...
  if (todayDiff === 2 && graceUsed >= MAX_GRACE_DAYS_PER_WEEK) {
    // Cannot apply grace for today's miss — streak broken
    currentStreak = 0
  }

  const historicalLongest = longestRun(sorted)
  const longestStreak = Math.max(prevLongest, currentStreak, historicalLongest)

  // Detect milestone
  const milestoneReached =
    (STREAK_MILESTONES.find((m) => m === currentStreak) as StreakMilestone) ?? null

  return {
    currentStreak,
    longestStreak,
    graceDaysUsed,
    lastLoggedDate: lastLog,
    milestoneReached,
  }
}

/**
 * Returns true if today is Monday (UTC) — grace days reset on Mondays.
 */
export function isMonday(dateStr: string): boolean {
  return new Date(dateStr + 'T00:00:00Z').getUTCDay() === 1
}
