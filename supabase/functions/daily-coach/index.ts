// supabase/functions/daily-coach/index.ts
// Deno Edge Function — runs at 23:00 UTC daily via pg_cron
// Generates tomorrow's AI coaching messages for all users who have habits.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-haiku-4-5-20251001'
const MAX_TOKENS = 600

interface Habit {
  id: string
  name: string
  description: string | null
  frequency: string
}

interface HabitLog {
  habit_id: string
  log_date: string
}

interface Streak {
  habit_id: string
  current_streak: number
  longest_streak: number
  grace_days_used_this_week: number
}

interface User {
  id: string
  email: string
  full_name: string | null
}

// ─── Authorization check ──────────────────────────────────────────────────────
// This function is called by pg_cron using the service role key.
// verify_jwt = true in config.toml so the Authorization header must be present.
function isAuthorized(req: Request): boolean {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return false
  // pg_cron passes the service role key as a Bearer token
  const token = authHeader.replace('Bearer ', '').trim()
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  return token === serviceRoleKey
}

// ─── Prompt builder ───────────────────────────────────────────────────────────
function buildCoachingPrompt(
  user: User,
  habits: Habit[],
  streaks: Streak[],
  recentLogs: HabitLog[],
  targetDate: string,
): string {
  const name = user.full_name?.split(' ')[0] ?? 'there'

  // Build per-habit context
  const habitContext = habits.map((habit) => {
    const streak = streaks.find((s) => s.habit_id === habit.id)
    const logsThisWeek = recentLogs.filter((l) => l.habit_id === habit.id).length
    const currentStreak = streak?.current_streak ?? 0
    const longestStreak = streak?.longest_streak ?? 0

    let streakNote = `${currentStreak}-day streak`
    if (currentStreak >= 30) streakNote += ' (incredible — 30+ days!)'
    else if (currentStreak >= 14) streakNote += ' (two weeks strong!)'
    else if (currentStreak >= 7) streakNote += ' (one week!)'
    else if (currentStreak >= 3) streakNote += ' (getting momentum!)'

    return `- ${habit.name}: ${streakNote}, ${logsThisWeek}/7 days this week, longest ever: ${longestStreak} days`
  }).join('\n')

  const totalCurrentStreak = streaks.reduce((sum, s) => sum + s.current_streak, 0)
  const isMilestone = streaks.some((s) =>
    [3, 7, 14, 30, 60, 90, 180, 365].includes(s.current_streak),
  )

  const messageStyle = isMilestone
    ? 'This is a MILESTONE day — write an extra celebratory and energizing message.'
    : 'Write a warm, encouraging daily check-in message.'

  return `You are a compassionate AI habit coach. ${messageStyle}

User: ${name}
Date: ${targetDate}
Habits being tracked:
${habitContext}

Write a personalized coaching message (150-250 words) that:
1. Addresses ${name} by name
2. References their specific habit names (not generic "your habits")
3. Acknowledges their current streak progress
4. Gives one concrete, actionable tip for tomorrow
5. Ends with a short motivational close

Tone: warm, personal, not preachy. Avoid generic platitudes.
Do not include a subject line or greeting prefix — start directly with the message content.`
}

// ─── Anthropic API call ───────────────────────────────────────────────────────
async function generateCoachingMessage(prompt: string): Promise<string> {
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set')

  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Anthropic API error ${response.status}: ${error}`)
  }

  const data = await response.json()
  return data.content[0].text as string
}

// ─── Main handler ─────────────────────────────────────────────────────────────
serve(async (req: Request) => {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  // Verify authorization
  if (!isAuthorized(req)) {
    return new Response('Unauthorized', { status: 401 })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response('Server configuration error', { status: 500 })
  }

  // Use service role client to bypass RLS for cron operations
  const supabase = createClient(supabaseUrl, serviceRoleKey)

  // Target date is tomorrow (messages generated night before)
  const tomorrow = new Date()
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
  const targetDate = tomorrow.toISOString().split('T')[0]

  // Seven days ago for recent log context
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 7)
  const weekAgo = sevenDaysAgo.toISOString().split('T')[0]

  let processed = 0
  let errors = 0

  try {
    // Get all users who have at least one active habit
    const { data: usersWithHabits, error: usersError } = await supabase
      .from('habits')
      .select('user_id')
      .eq('archived', false)

    if (usersError) throw usersError

    // Deduplicate user IDs
    const userIds = [...new Set(usersWithHabits?.map((r: { user_id: string }) => r.user_id) ?? [])]

    for (const userId of userIds) {
      try {
        // Fetch user profile
        const { data: userRow, error: userError } = await supabase
          .from('users')
          .select('id, email, full_name')
          .eq('id', userId)
          .single()

        if (userError || !userRow) continue

        // Fetch active habits
        const { data: habits, error: habitsError } = await supabase
          .from('habits')
          .select('id, name, description, frequency')
          .eq('user_id', userId)
          .eq('archived', false)

        if (habitsError || !habits?.length) continue

        const habitIds = habits.map((h: Habit) => h.id)

        // Fetch current streaks
        const { data: streaks, error: streaksError } = await supabase
          .from('streaks')
          .select('habit_id, current_streak, longest_streak, grace_days_used_this_week')
          .eq('user_id', userId)
          .in('habit_id', habitIds)

        if (streaksError) continue

        // Fetch last 7 days of logs for context
        const { data: recentLogs, error: logsError } = await supabase
          .from('habit_logs')
          .select('habit_id, log_date')
          .eq('user_id', userId)
          .in('habit_id', habitIds)
          .gte('log_date', weekAgo)

        if (logsError) continue

        // Check idempotency — skip if message already exists for this date
        const { data: existing } = await supabase
          .from('ai_messages')
          .select('id')
          .eq('user_id', userId)
          .eq('message_date', targetDate)
          .eq('message_type', 'daily')
          .maybeSingle()

        if (existing) {
          processed++
          continue // Already generated, skip
        }

        // Build prompt and generate message
        const prompt = buildCoachingPrompt(
          userRow as User,
          habits as Habit[],
          (streaks ?? []) as Streak[],
          (recentLogs ?? []) as HabitLog[],
          targetDate,
        )

        const messageContent = await generateCoachingMessage(prompt)

        // Detect if this is a milestone message
        const isMilestone = (streaks ?? []).some((s: Streak) =>
          [3, 7, 14, 30, 60, 90, 180, 365].includes(s.current_streak),
        )

        // Store in ai_messages with ON CONFLICT DO NOTHING for idempotency
        const { error: insertError } = await supabase
          .from('ai_messages')
          .insert({
            user_id: userId,
            message_date: targetDate,
            message_type: isMilestone ? 'milestone' : 'daily',
            content: messageContent,
            model_used: MODEL,
            prompt_tokens: 0, // Would need Anthropic usage data — set to 0 for now
            completion_tokens: 0,
          })
          .onConflict(['user_id', 'message_date', 'message_type'])
          .ignore()

        if (!insertError) {
          processed++
        } else {
          console.error(`Insert error for user ${userId}:`, insertError)
          errors++
        }
      } catch (userErr) {
        console.error(`Error processing user ${userId}:`, userErr)
        errors++
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed,
        errors,
        target_date: targetDate,
        total_users: userIds.length,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    )
  } catch (err) {
    console.error('daily-coach function failed:', err)
    return new Response(
      JSON.stringify({ success: false, error: String(err) }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    )
  }
})
