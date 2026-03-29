// src/test/streak.test.ts
// Unit tests for streak calculation logic.
// Tests mirror the business rules defined in STACK.md §3.5.

import { describe, it, expect } from 'vitest'
import { calculateStreak, isMonday, STREAK_MILESTONES } from '../lib/streak'

// ─── Helper ───────────────────────────────────────────────────────────────────
/**
 * Build a contiguous list of YYYY-MM-DD dates starting from `start` for `count` days.
 */
function consecutiveDates(start: string, count: number): string[] {
  const result: string[] = []
  const d = new Date(start + 'T00:00:00Z')
  for (let i = 0; i < count; i++) {
    result.push(d.toISOString().split('T')[0])
    d.setUTCDate(d.getUTCDate() + 1)
  }
  return result
}

/**
 * Add N days to a YYYY-MM-DD date string.
 */
function addDays(date: string, n: number): string {
  const d = new Date(date + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().split('T')[0]
}

// ─── Consecutive streak tests ─────────────────────────────────────────────────
describe('calculateStreak — consecutive logs', () => {
  it('counts a single log as streak of 1', () => {
    const today = '2026-03-27'
    const result = calculateStreak(['2026-03-27'], today)
    expect(result.currentStreak).toBe(1)
  })

  it('counts 3 consecutive days correctly', () => {
    const today = '2026-03-27'
    const logs = consecutiveDates('2026-03-25', 3) // 25, 26, 27
    const result = calculateStreak(logs, today)
    expect(result.currentStreak).toBe(3)
  })

  it('counts 7 consecutive days correctly', () => {
    const today = '2026-03-27'
    const logs = consecutiveDates('2026-03-21', 7) // 21 through 27
    const result = calculateStreak(logs, today)
    expect(result.currentStreak).toBe(7)
  })

  it('counts 14 consecutive days correctly', () => {
    const today = '2026-03-27'
    const logs = consecutiveDates('2026-03-14', 14) // 14 through 27
    const result = calculateStreak(logs, today)
    expect(result.currentStreak).toBe(14)
  })

  it('counts 30 consecutive days correctly', () => {
    const today = '2026-03-27'
    const logs = consecutiveDates('2026-02-26', 30)
    const result = calculateStreak(logs, today)
    expect(result.currentStreak).toBe(30)
  })

  it('deduplates duplicate log dates', () => {
    const today = '2026-03-27'
    const logs = ['2026-03-25', '2026-03-25', '2026-03-26', '2026-03-27']
    const result = calculateStreak(logs, today)
    expect(result.currentStreak).toBe(3)
  })

  it('handles logs out of order by sorting them', () => {
    const today = '2026-03-27'
    const logs = ['2026-03-27', '2026-03-25', '2026-03-26'] // unsorted
    const result = calculateStreak(logs, today)
    expect(result.currentStreak).toBe(3)
  })
})

// ─── Grace day tests ──────────────────────────────────────────────────────────
describe('calculateStreak — grace day logic', () => {
  it('one missed day within a week uses grace and continues streak', () => {
    const today = '2026-03-27'
    // Logged: 22, 23, 24, (25 missed), 26, 27
    const logs = ['2026-03-22', '2026-03-23', '2026-03-24', '2026-03-26', '2026-03-27']
    const result = calculateStreak(logs, today, 0)
    expect(result.currentStreak).toBe(5) // 22–27 with one grace day
    expect(result.graceDaysUsed).toBe(1)
  })

  it('two missed days in one week breaks the streak at the second gap', () => {
    const today = '2026-03-27'
    // Logged: 21, 22, (23 missed), 24, (25 missed), 26, 27
    // First gap (22→24): grace applied. Second gap (24→26): grace exhausted → break.
    const logs = ['2026-03-21', '2026-03-22', '2026-03-24', '2026-03-26', '2026-03-27']
    const result = calculateStreak(logs, today, 0)
    // Streak only goes back to 26, 27 (or 24, 26, 27 depending on where walk stops)
    // After grace exhaustion at the second gap, streak stops before 24→26
    expect(result.currentStreak).toBeLessThan(5)
    expect(result.graceDaysUsed).toBeGreaterThanOrEqual(1)
  })

  it('grace day is not applied when grace limit already reached this week', () => {
    const today = '2026-03-27'
    // graceUsed = 1 means grace is already exhausted
    // Logged: 24, (25 missed), 26, 27 — gap at 24→26 would need grace but it's used up
    const logs = ['2026-03-24', '2026-03-26', '2026-03-27']
    const result = calculateStreak(logs, today, 1) // grace already used
    // Streak from today: 26, 27 = 2 (cannot bridge 24→26 gap)
    expect(result.currentStreak).toBe(2)
  })

  it('grace allows a missed day when checking if today was missed', () => {
    // Today is not logged yet but yesterday was — streak of 5 should hold
    const today = '2026-03-27'
    const logs = consecutiveDates('2026-03-22', 5) // 22 through 26 (not today)
    const result = calculateStreak(logs, today, 0)
    // Gap from 26 to 27 is 1 day — not a missed day, streak persists
    expect(result.currentStreak).toBe(5)
  })

  it('streak breaks when last log was 3 days ago even with grace available', () => {
    const today = '2026-03-27'
    // Last log was 2026-03-24 (3 days ago)
    const logs = consecutiveDates('2026-03-20', 5) // 20 through 24
    const result = calculateStreak(logs, today, 0)
    expect(result.currentStreak).toBe(0)
  })
})

// ─── Streak break and reset tests ────────────────────────────────────────────
describe('calculateStreak — streak breaks', () => {
  it('returns 0 when no logs exist', () => {
    const result = calculateStreak([], '2026-03-27')
    expect(result.currentStreak).toBe(0)
    expect(result.lastLoggedDate).toBeNull()
  })

  it('returns 0 after a long gap', () => {
    const today = '2026-03-27'
    // Last log was 10 days ago
    const logs = consecutiveDates('2026-03-10', 5) // 10 through 14 (13 days ago)
    const result = calculateStreak(logs, today)
    expect(result.currentStreak).toBe(0)
  })

  it('preserves longest streak even after current streak breaks', () => {
    const today = '2026-03-27'
    // Had a 10-day streak then broke it 5 days ago
    const oldLogs = consecutiveDates('2026-03-08', 10) // 8 through 17 (10 days)
    const result = calculateStreak(oldLogs, today, 0, 10) // prevLongest = 10
    expect(result.currentStreak).toBe(0) // broken (streak ended 10 days ago)
    expect(result.longestStreak).toBe(10) // preserved from prevLongest
  })

  it('updates longest streak when current beats previous best', () => {
    const today = '2026-03-27'
    const logs = consecutiveDates('2026-03-01', 27) // 27-day streak up to today
    const result = calculateStreak(logs, today, 0, 14) // previous best was 14
    expect(result.currentStreak).toBe(27)
    expect(result.longestStreak).toBe(27)
  })

  it('restarted streak after a break builds from 1', () => {
    const today = '2026-03-27'
    // Old streak then a gap then new streak starting today
    const logs = [
      ...consecutiveDates('2026-03-01', 7), // old 7-day streak (ended Mar 7)
      '2026-03-27', // restarted today after 20-day gap
    ]
    const result = calculateStreak(logs, today, 0, 7)
    expect(result.currentStreak).toBe(1) // new streak just started
    expect(result.longestStreak).toBe(7) // old best preserved
  })
})

// ─── Longest streak tracking ──────────────────────────────────────────────────
describe('calculateStreak — longest streak tracking', () => {
  it('tracks longest streak across non-continuous log history', () => {
    // Streak 1: 5 days, Streak 2: 3 days, Streak 3: currently 8 days
    const today = '2026-03-27'
    const logs = [
      ...consecutiveDates('2026-02-01', 5), // 5-day block
      // gap
      ...consecutiveDates('2026-02-15', 3), // 3-day block
      // gap
      ...consecutiveDates('2026-03-20', 8), // 8-day block up to today
    ]
    const result = calculateStreak(logs, today)
    expect(result.currentStreak).toBe(8)
    expect(result.longestStreak).toBe(8)
  })

  it('uses prevLongest when it exceeds all computed runs', () => {
    const today = '2026-03-27'
    const logs = ['2026-03-27'] // just today
    const result = calculateStreak(logs, today, 0, 42) // previous best was 42
    expect(result.currentStreak).toBe(1)
    expect(result.longestStreak).toBe(42)
  })
})

// ─── Milestone detection ──────────────────────────────────────────────────────
describe('calculateStreak — milestone detection', () => {
  const today = '2026-03-27'

  it.each(STREAK_MILESTONES)('detects milestone at %i days', (milestone) => {
    const logs = consecutiveDates(addDays(today, -(milestone - 1)), milestone)
    const result = calculateStreak(logs, today)
    expect(result.currentStreak).toBe(milestone)
    expect(result.milestoneReached).toBe(milestone)
  })

  it('does not flag milestone for non-milestone streaks', () => {
    const logs = consecutiveDates('2026-03-22', 6) // 6 days — not a milestone
    const result = calculateStreak(logs, today)
    expect(result.currentStreak).toBe(6)
    expect(result.milestoneReached).toBeNull()
  })

  it('milestone is null when streak is 0', () => {
    const result = calculateStreak([], today)
    expect(result.milestoneReached).toBeNull()
  })
})

// ─── lastLoggedDate tracking ──────────────────────────────────────────────────
describe('calculateStreak — lastLoggedDate', () => {
  it('returns null when no logs', () => {
    const result = calculateStreak([], '2026-03-27')
    expect(result.lastLoggedDate).toBeNull()
  })

  it('returns the most recent log date', () => {
    const logs = ['2026-03-20', '2026-03-25', '2026-03-27']
    const result = calculateStreak(logs, '2026-03-27')
    expect(result.lastLoggedDate).toBe('2026-03-27')
  })

  it('returns most recent date even when streak is broken', () => {
    const today = '2026-03-27'
    const logs = consecutiveDates('2026-03-01', 5) // ended March 5
    const result = calculateStreak(logs, today)
    expect(result.currentStreak).toBe(0)
    expect(result.lastLoggedDate).toBe('2026-03-05')
  })
})

// ─── isMonday helper ──────────────────────────────────────────────────────────
describe('isMonday', () => {
  it('returns true for a Monday', () => {
    expect(isMonday('2026-03-23')).toBe(true) // Mon Mar 23 2026
  })

  it('returns false for a Tuesday', () => {
    expect(isMonday('2026-03-24')).toBe(false)
  })

  it('returns false for a Sunday', () => {
    expect(isMonday('2026-03-29')).toBe(false)
  })
})
