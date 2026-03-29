// src/lib/ai-coach.ts
// Prompt building and Anthropic API integration for daily coaching messages.
// Server-side only — never imported by client components.

import 'server-only'

export interface HabitSummary {
  name: string
  currentStreak: number
  lastLoggedDate: string | null
  isMillestone: boolean
  milestoneValue: number | null
}

export interface CoachingContext {
  userName: string
  targetDate: string
  habits: HabitSummary[]
  totalCurrentStreak: number
}

export type MessageType = 'daily' | 'milestone' | 'welcome'

export interface CoachingPromptResult {
  prompt: string
  messageType: MessageType
}

/**
 * Builds the prompt string for the Anthropic API call.
 * Pure function — no side effects, fully testable without mocking.
 */
export function buildCoachingPrompt(ctx: CoachingContext): CoachingPromptResult {
  const { userName, targetDate, habits, totalCurrentStreak } = ctx
  const firstName = userName.split(' ')[0] || 'there'

  const isMilestone = habits.some((h) => h.isMillestone)
  const messageType: MessageType = isMilestone ? 'milestone' : 'daily'

  const habitLines = habits
    .map((h) => {
      const streakLabel =
        h.currentStreak === 0
          ? 'no current streak'
          : h.currentStreak === 1
            ? '1-day streak (just started!)'
            : `${h.currentStreak}-day streak`

      const milestoneNote = h.isMillestone && h.milestoneValue
        ? ` *** MILESTONE: ${h.milestoneValue} days! ***`
        : ''

      return `  - ${h.name}: ${streakLabel}${milestoneNote}`
    })
    .join('\n')

  const styleInstruction = isMilestone
    ? 'This is a MILESTONE achievement day. Be extra celebratory and energizing. Acknowledge the specific milestone number.'
    : 'Write a warm, encouraging daily check-in message. Vary the tone — avoid repeating phrases from yesterday.'

  const prompt = `You are a compassionate AI habit coach. ${styleInstruction}

User's first name: ${firstName}
Date: ${targetDate}
Combined active streak across all habits: ${totalCurrentStreak} days

Habits and current streaks:
${habitLines}

Write a personalized coaching message (150–250 words) that:
1. Greets ${firstName} by name
2. References their specific habit names — never say "your habits" generically
3. Acknowledges the streak numbers for each habit
4. Offers one concrete, actionable tip for tomorrow
5. Ends with a warm, motivating close

Rules:
- Do NOT include a subject line or email-style greeting
- Start directly with the message body
- Do NOT use the word "journey" or "amazing"
- Tone: human, warm, specific. Not corporate. Not preachy.`

  return { prompt, messageType }
}

/**
 * Calls the Anthropic API to generate a coaching message.
 * Throws on API error — caller is responsible for error handling and caching.
 */
export async function generateMessage(prompt: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set')

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Anthropic API error ${response.status}: ${body}`)
  }

  const data = await response.json()
  return data.content[0].text as string
}
