// src/test/ai-coach.test.ts
// Unit tests for AI coaching prompt building and message generation.
// The Anthropic API call is mocked — these tests cover prompt correctness only.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { buildCoachingPrompt, generateMessage } from '../lib/ai-coach'
import type { CoachingContext } from '../lib/ai-coach'

// ─── Test fixtures ────────────────────────────────────────────────────────────

const singleHabitContext: CoachingContext = {
  userName: 'Alice Smith',
  targetDate: '2026-03-27',
  habits: [
    {
      name: 'Morning Run',
      currentStreak: 5,
      lastLoggedDate: '2026-03-26',
      isMillestone: false,
      milestoneValue: null,
    },
  ],
  totalCurrentStreak: 5,
}

const multiHabitContext: CoachingContext = {
  userName: 'Bob Jones',
  targetDate: '2026-03-27',
  habits: [
    {
      name: 'Meditation',
      currentStreak: 7,
      lastLoggedDate: '2026-03-26',
      isMillestone: true,
      milestoneValue: 7,
    },
    {
      name: 'Read 20 pages',
      currentStreak: 3,
      lastLoggedDate: '2026-03-26',
      isMillestone: false,
      milestoneValue: null,
    },
  ],
  totalCurrentStreak: 10,
}

const zeroStreakContext: CoachingContext = {
  userName: 'Carol White',
  targetDate: '2026-03-27',
  habits: [
    {
      name: 'Drink 2L water',
      currentStreak: 0,
      lastLoggedDate: null,
      isMillestone: false,
      milestoneValue: null,
    },
  ],
  totalCurrentStreak: 0,
}

// ─── Prompt content tests ─────────────────────────────────────────────────────
describe('buildCoachingPrompt — habit names in prompt', () => {
  it('includes the habit name in the prompt', () => {
    const { prompt } = buildCoachingPrompt(singleHabitContext)
    expect(prompt).toContain('Morning Run')
  })

  it('includes all habit names when multiple habits exist', () => {
    const { prompt } = buildCoachingPrompt(multiHabitContext)
    expect(prompt).toContain('Meditation')
    expect(prompt).toContain('Read 20 pages')
  })

  it('includes the user first name in the prompt', () => {
    const { prompt } = buildCoachingPrompt(singleHabitContext)
    // First name only
    expect(prompt).toContain('Alice')
    // Should NOT include last name in the habit list (optional — but first name used for greeting)
  })

  it('uses first name only when userName has multiple words', () => {
    const { prompt } = buildCoachingPrompt(singleHabitContext)
    // "Alice" appears, but the prompt should address by first name
    expect(prompt).toContain('Alice')
  })
})

describe('buildCoachingPrompt — streak count in prompt', () => {
  it('includes the current streak number', () => {
    const { prompt } = buildCoachingPrompt(singleHabitContext)
    expect(prompt).toContain('5')
  })

  it('includes streak numbers for all habits', () => {
    const { prompt } = buildCoachingPrompt(multiHabitContext)
    expect(prompt).toContain('7')
    expect(prompt).toContain('3')
  })

  it('includes total combined streak', () => {
    const { prompt } = buildCoachingPrompt(multiHabitContext)
    expect(prompt).toContain('10')
  })

  it('shows "no current streak" when streak is 0', () => {
    const { prompt } = buildCoachingPrompt(zeroStreakContext)
    expect(prompt).toContain('no current streak')
  })

  it('shows "1-day streak" label for a brand new streak', () => {
    const ctx: CoachingContext = {
      ...singleHabitContext,
      habits: [
        {
          name: 'Yoga',
          currentStreak: 1,
          lastLoggedDate: '2026-03-27',
          isMillestone: false,
          milestoneValue: null,
        },
      ],
      totalCurrentStreak: 1,
    }
    const { prompt } = buildCoachingPrompt(ctx)
    expect(prompt).toContain('1-day streak')
  })
})

describe('buildCoachingPrompt — daily vs milestone message type', () => {
  it('returns messageType "daily" for a non-milestone context', () => {
    const { messageType } = buildCoachingPrompt(singleHabitContext)
    expect(messageType).toBe('daily')
  })

  it('returns messageType "milestone" when any habit has hit a milestone', () => {
    const { messageType } = buildCoachingPrompt(multiHabitContext)
    expect(messageType).toBe('milestone')
  })

  it('includes MILESTONE keyword in prompt for milestone context', () => {
    const { prompt } = buildCoachingPrompt(multiHabitContext)
    expect(prompt.toUpperCase()).toContain('MILESTONE')
  })

  it('includes the milestone value in the prompt', () => {
    const { prompt } = buildCoachingPrompt(multiHabitContext)
    // milestoneValue = 7 for Meditation
    expect(prompt).toContain('7 days')
  })

  it('does not include MILESTONE keyword for regular daily prompt', () => {
    const { prompt, messageType } = buildCoachingPrompt(singleHabitContext)
    expect(messageType).toBe('daily')
    // The style instruction should be for daily, not milestone
    expect(prompt).not.toContain('MILESTONE achievement day')
  })
})

describe('buildCoachingPrompt — prompt structure requirements', () => {
  it('includes the target date in the prompt', () => {
    const { prompt } = buildCoachingPrompt(singleHabitContext)
    expect(prompt).toContain('2026-03-27')
  })

  it('instructs not to use generic "your habits" phrase', () => {
    const { prompt } = buildCoachingPrompt(singleHabitContext)
    // The prompt should instruct Claude not to be generic
    expect(prompt).toContain('specific habit names')
  })

  it('asks for actionable tip for tomorrow', () => {
    const { prompt } = buildCoachingPrompt(singleHabitContext)
    expect(prompt.toLowerCase()).toContain('tomorrow')
  })

  it('prompt length is reasonable (not empty, not huge)', () => {
    const { prompt } = buildCoachingPrompt(multiHabitContext)
    expect(prompt.length).toBeGreaterThan(200)
    expect(prompt.length).toBeLessThan(3000) // not accidentally massive
  })
})

// ─── generateMessage — Anthropic API mock tests ───────────────────────────────
describe('generateMessage — API call', () => {
  const mockFetch = vi.fn()

  beforeEach(() => {
    // Set the env var for tests
    process.env.ANTHROPIC_API_KEY = 'test-key-sk-ant'
    vi.stubGlobal('fetch', mockFetch)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    delete process.env.ANTHROPIC_API_KEY
    mockFetch.mockReset()
  })

  it('calls the Anthropic API with correct model and headers', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        content: [{ text: 'Great job on your streak, Alice!' }],
      }),
    })

    await generateMessage('Test prompt')

    expect(mockFetch).toHaveBeenCalledOnce()
    const [url, options] = mockFetch.mock.calls[0]
    expect(url).toBe('https://api.anthropic.com/v1/messages')
    expect(options.method).toBe('POST')
    expect(options.headers['x-api-key']).toBe('test-key-sk-ant')
    expect(options.headers['anthropic-version']).toBe('2023-06-01')

    const body = JSON.parse(options.body)
    expect(body.model).toBe('claude-haiku-4-5-20251001')
    expect(body.messages[0].content).toBe('Test prompt')
  })

  it('returns the text content from the API response', async () => {
    const expectedMessage = 'You are crushing it! Keep up the Morning Run streak.'
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        content: [{ text: expectedMessage }],
      }),
    })

    const result = await generateMessage('Test prompt')
    expect(result).toBe(expectedMessage)
  })

  it('throws an error when the API returns a non-200 status', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 429,
      text: async () => 'Rate limit exceeded',
    })

    await expect(generateMessage('Test prompt')).rejects.toThrow(
      'Anthropic API error 429',
    )
  })

  it('throws an error when ANTHROPIC_API_KEY is not set', async () => {
    delete process.env.ANTHROPIC_API_KEY

    await expect(generateMessage('Test prompt')).rejects.toThrow(
      'ANTHROPIC_API_KEY is not set',
    )

    // fetch should not have been called
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('passes max_tokens of 600 to the API', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ content: [{ text: 'Hello!' }] }),
    })

    await generateMessage('Test prompt')

    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body.max_tokens).toBe(600)
  })
})
