import "server-only"; // NEVER import this module in a Client Component
import Anthropic from "@anthropic-ai/sdk";

/**
 * Anthropic Claude API client.
 * Only instantiate server-side — ANTHROPIC_API_KEY must never be exposed to the browser.
 *
 * Model: claude-haiku-4-5-20251001
 * Use haiku for all daily coaching messages (cost-efficient, fast, sufficient quality).
 * Reserve claude-sonnet-* for future Phase 2 deep-dive weekly reviews.
 */
export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const DEFAULT_MODEL = "claude-haiku-4-5-20251001" as const;

export const MAX_TOKENS = {
  daily_message: 300,
  day1_welcome: 400,
  streak_milestone: 250,
} as const;

/**
 * Generate a coaching message for a user.
 * Called by POST /api/ai/message (server-side only).
 */
export async function generateCoachingMessage(prompt: string, maxTokens: number = 300) {
  const response = await anthropic.messages.create({
    model: DEFAULT_MODEL,
    max_tokens: maxTokens,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const content = response.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type from Claude API");
  }

  return {
    text: content.text,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
    model: response.model,
  };
}
