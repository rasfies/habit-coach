// supabase/functions/streak-audit/index.ts
// Deno Edge Function — runs at 00:05 UTC daily via pg_cron
// Recalculates streaks for all users, applies grace day logic,
// and resets grace_days_used_this_week every Monday.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface Habit {
  id: string
  user_id: string
  frequency: string // 'daily' | 'weekly'
  archived: boolean
}

interface HabitLog {
  habit_id: string
  user_id: string
  log_date: string // YYYY-MM-DD
}

interface StreakRow {
  habit_id: string
  user_id: string
  current_streak: number
  longest_streak: number
  last_logged_date: string | null
  grace_days_used_this_week: number
}

const MAX_GRACE_DAYS_PER_WEEK = 1

// ─── Streak calculation (pure function — mirrors web app logic) ───────────────
// This must stay in sync with apps/web/src/lib/streak.ts
function calculateStreak(
  logs: string[], // sorted YYYY-MM-DD dates, ascending
  today: string,
  graceUsedThisWeek: number,
): {
  currentStreak: number
  longestStreak: number
  graceDaysUsed: number
  lastLoggedDate: string | null
} {
  if (logs.length === 0) {
    return { currentStreak: 0, longestStreak: 0, graceDaysUsed: 0, lastLoggedDate: null }
  }

  const sortedLogs = [...new Set(logs)].sort()
  const lastLog = sortedLogs[sortedLogs.length - 1]

  // Convert date strings to Date objects for arithmetic
  function toDate(s: string): Date {
    return new Date(s + 'T00:00:00Z')
  }

  function diffDays(a: string, b: string): number {
    return Math.round(
      (toDate(b).getTime() - toDate(a).getTime()) / (1000 * 60 * 60 * 24),
    )
  }

  const todayDiff = diffDays(lastLog, today)

  // If last log is more than 2 days ago (with grace), streak is broken
  if (todayDiff > 2) {
    // Streak broken — find the longest historical streak
    let longest = 1
    let run = 1
    for (let i = 1; i < sortedLogs.length; i++) {
      const gap = diffDays(sortedLogs[i - 1], sortedLogs[i])
      if (gap === 1) {
        run++
        longest = Math.max(longest, run)
      } else {
        run = 1
      }
    }
    return { currentStreak: 0, longestStreak: longest, graceDaysUsed: graceUsedThisWeek, lastLoggedDate: lastLog }
  }

  // Count current streak walking backwards through logs
  let currentStreak = 1
  let graceDaysUsed = graceUsedThisWeek
  let longestStreak = 1

  for (let i = sortedLogs.length - 2; i >= 0; i--) {
    const gap = diffDays(sortedLogs[i], sortedLogs[i + 1])

    if (gap === 1) {
      // Consecutive day — streak continues
      currentStreak++
    } else if (gap === 2 && graceDaysUsed < MAX_GRACE_DAYS_PER_WEEK) {
      // One missed day within grace allowance — streak continues
      graceDaysUsed++
      currentStreak++
    } else {
      // Gap too large or grace exhausted — streak stops here
      break
    }
  }

  // Account for today not being logged yet (gap of 1 from last log is OK)
  if (todayDiff > 1 && graceDaysUsed >= MAX_GRACE_DAYS_PER_WEEK) {
    // Used all grace days and missed today — break the streak
    currentStreak = 0
  }

  // Calculate all-time longest streak
  let tempLongest = 1
  let tempRun = 1
  for (let i = 1; i < sortedLogs.length; i++) {
    const gap = diffDays(sortedLogs[i - 1], sortedLogs[i])
    if (gap === 1) {
      tempRun++
      tempLongest = Math.max(tempLongest, tempRun)
    } else {
      tempRun = 1
    }
  }
  longestStreak = Math.max(currentStreak, tempLongest)

  return { currentStreak, longestStreak, graceDaysUsed, lastLoggedDate: lastLog }
}

// ─── Is today Monday? (grace day reset) ──────────────────────────────────────
function isMonday(dateStr: string): boolean {
  const d = new Date(dateStr + 'T00:00:00Z')
  return d.getUTCDay() === 1
}

// ─── Main handler ─────────────────────────────────────────────────────────────
serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  // verify_jwt = false in config.toml, but validate service key manually
  const authHeader = req.headers.get('Authorization')
  const token = authHeader?.replace('Bearer ', '').trim()
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!token || token !== serviceRoleKey) {
    return new Response('Unauthorized', { status: 401 })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  if (!supabaseUrl || !serviceRoleKey) {
    return new Response('Server configuration error', { status: 500 })
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey)

  // Today in UTC
  const now = new Date()
  const today = now.toISOString().split('T')[0]
  const isResetDay = isMonday(today)

  // Look back 60 days for log history (sufficient for streak + grace calculation)
  const lookbackDate = new Date()
  lookbackDate.setUTCDate(lookbackDate.getUTCDate() - 60)
  const since = lookbackDate.toISOString().split('T')[0]

  let audited = 0
  let updated = 0
  let errors = 0

  try {
    // Fetch all active habits
    const { data: habits, error: habitsError } = await supabase
      .from('habits')
      .select('id, user_id, frequency, archived')
      .eq('archived', false)

    if (habitsError) throw habitsError
    if (!habits?.length) {
      return new Response(JSON.stringify({ success: true, audited: 0, updated: 0 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const habitIds = habits.map((h: Habit) => h.id)

    // Fetch all relevant logs in one query
    const { data: allLogs, error: logsError } = await supabase
      .from('habit_logs')
      .select('habit_id, user_id, log_date')
      .in('habit_id', habitIds)
      .gte('log_date', since)
      .order('log_date', { ascending: true })

    if (logsError) throw logsError

    // Fetch existing streak rows
    const { data: existingStreaks, error: streaksError } = await supabase
      .from('streaks')
      .select('habit_id, user_id, current_streak, longest_streak, last_logged_date, grace_days_used_this_week')
      .in('habit_id', habitIds)

    if (streaksError) throw streaksError

    // Build lookup maps
    const logsByHabit = new Map<string, string[]>()
    for (const log of (allLogs ?? []) as HabitLog[]) {
      const existing = logsByHabit.get(log.habit_id) ?? []
      existing.push(log.log_date)
      logsByHabit.set(log.habit_id, existing)
    }

    const streakByHabit = new Map<string, StreakRow>()
    for (const streak of (existingStreaks ?? []) as StreakRow[]) {
      streakByHabit.set(streak.habit_id, streak)
    }

    // Process each habit
    const upsertBatch: object[] = []

    for (const habit of habits as Habit[]) {
      audited++

      const logs = logsByHabit.get(habit.id) ?? []
      const existingStreak = streakByHabit.get(habit.id)
      const currentGrace = isResetDay ? 0 : (existingStreak?.grace_days_used_this_week ?? 0)

      const { currentStreak, longestStreak, graceDaysUsed, lastLoggedDate } = calculateStreak(
        logs,
        today,
        currentGrace,
      )

      const newLongest = Math.max(longestStreak, existingStreak?.longest_streak ?? 0)

      upsertBatch.push({
        habit_id: habit.id,
        user_id: habit.user_id,
        current_streak: currentStreak,
        longest_streak: newLongest,
        last_logged_date: lastLoggedDate,
        grace_days_used_this_week: graceDaysUsed,
        last_audited_at: now.toISOString(),
      })
    }

    // Upsert all streaks in one batch
    if (upsertBatch.length > 0) {
      const { error: upsertError } = await supabase
        .from('streaks')
        .upsert(upsertBatch, {
          onConflict: 'habit_id',
          ignoreDuplicates: false,
        })

      if (upsertError) {
        console.error('Upsert error:', upsertError)
        errors++
      } else {
        updated = upsertBatch.length
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        audited,
        updated,
        errors,
        grace_reset: isResetDay,
        audit_date: today,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    )
  } catch (err) {
    console.error('streak-audit function failed:', err)
    return new Response(
      JSON.stringify({ success: false, error: String(err) }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    )
  }
})
