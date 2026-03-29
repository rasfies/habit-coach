import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { CoachingResult } from "@/lib/ai-coach";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const MODEL = "claude-haiku-4-5-20251001";

/**
 * Call Claude to generate a coaching message from a prompt.
 * Returns the message text plus token usage metadata.
 */
export async function generateCoachingMessage(
  prompt: string,
  maxTokens = 200
): Promise<CoachingResult> {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    messages: [{ role: "user", content: prompt }],
  });

  const text =
    response.content[0]?.type === "text" ? response.content[0].text : "";

  return {
    text,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
    model: response.model,
  };
}
