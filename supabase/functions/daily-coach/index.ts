/**
 * Supabase Edge Function: daily-coach
 * Runtime: Deno
 *
 * Schedule: nightly via pg_cron (e.g., "0 2 * * *" = 02:00 UTC)
 *
 * For each active user:
 * 1. Fetches their active habits + recent logs + current streaks
 * 2. Generates a daily coaching message via Claude Haiku
 * 3. Stores the message in ai_messages for tomorrow's date
 * 4. Sends push notification if the user has an active token
 *
 * Invoked by the Supabase scheduler:
 *   SELECT cron.schedule('daily-coach', '0 2 * * *', $$SELECT net.http_post(...)$$);
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Anthropic from "https://esm.sh/@anthropic-ai/sdk@0.36.3";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY")!;

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

const anthropic = new Anthropic({ apiKey: anthropicApiKey });

const MODEL = "claude-haiku-4-5-20251001";
const MAX_TOKENS = 200;

interface HabitWithStreakAndLogs {
  id: string;
  name: string;
  current_streak: number;
  longest_streak: number;
  days_completed_last_7: number;
  completed_today: boolean;
}

async function generateMessage(
  displayName: string,
  habits: HabitWithStreakAndLogs[]
): Promise<{ text: string; inputTokens: number; outputTokens: number }> {
  if (habits.length === 0) {
    return {
      text: `Hi ${displayName}! Add some habits to get started on your journey.`,
      inputTokens: 0,
      outputTokens: 0,
    };
  }

  const habitSummary = habits
    .map(
      (h) =>
        `- "${h.name}": ${h.current_streak}-day streak, ${h.days_completed_last_7}/7 days last week`
    )
    .join("\n");

  const highestStreak = Math.max(...habits.map((h) => h.current_streak));
  const topHabit = habits.find((h) => h.current_streak === highestStreak);
  const nextMilestone = [3, 7, 14, 30].find((m) => m > highestStreak);

  const prompt = `You are a warm, personal habit coach. Write a daily coaching message for ${displayName}.

Their habit progress (last 7 days):
${habitSummary}

${nextMilestone && topHabit ? `Streak context: ${nextMilestone - highestStreak} day(s) until the ${nextMilestone}-day milestone for "${topHabit.name}".` : ""}

Rules:
- 2-4 sentences maximum
- Reference their specific habit names
- Be encouraging but direct — not generic
- No clichés like "Great job!" or "Keep it up!"
- This message will be read tomorrow morning`;

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    messages: [{ role: "user", content: prompt }],
  });

  const content = response.content[0];
  if (content.type !== "text") throw new Error("Unexpected Claude response type");

  return {
    text: content.text,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
  };
}

async function sendPushNotification(
  token: string,
  message: string
): Promise<void> {
  // Expo Push Notification API
  try {
    await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        to: token,
        title: "Your Daily Coach",
        body: message.slice(0, 150),
        sound: "default",
      }),
    });
  } catch (err) {
    console.error(`Push notification failed for token ${token}:`, err);
  }
}

Deno.serve(async (_req) => {
  try {
    const tomorrow = new Date();
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    const tomorrowStr = tomorrow.toISOString().slice(0, 10);
    const today = new Date().toISOString().slice(0, 10);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().slice(0, 10);

    // Fetch all active users
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, display_name, notification_enabled");

    if (usersError) throw usersError;

    let processed = 0;
    let errors = 0;

    for (const user of users ?? []) {
      try {
        // Skip if message already exists for tomorrow
        const { data: existing } = await supabase
          .from("ai_messages")
          .select("id")
          .eq("user_id", user.id)
          .eq("message_date", tomorrowStr)
          .eq("message_type", "daily")
          .single();

        if (existing) continue;

        // Fetch habits with streaks
        const { data: habits } = await supabase
          .from("habits")
          .select(
            "id, name, streaks ( current_streak, longest_streak ), habit_logs ( log_date, completed )"
          )
          .eq("user_id", user.id)
          .eq("is_active", true);

        const habitContexts: HabitWithStreakAndLogs[] = (habits ?? []).map(
          (h) => {
            const streak = Array.isArray(h.streaks)
              ? h.streaks[0]
              : h.streaks;
            const logs = Array.isArray(h.habit_logs) ? h.habit_logs : [];
            const recentLogs = logs.filter(
              (l) => l.log_date >= sevenDaysAgoStr && l.completed
            );
            const completedToday = logs.some(
              (l) => l.log_date === today && l.completed
            );

            return {
              id: h.id,
              name: h.name,
              current_streak: streak?.current_streak ?? 0,
              longest_streak: streak?.longest_streak ?? 0,
              days_completed_last_7: recentLogs.length,
              completed_today: completedToday,
            };
          }
        );

        if (habitContexts.length === 0) continue;

        // Generate message
        const { text, inputTokens, outputTokens } = await generateMessage(
          user.display_name,
          habitContexts
        );

        // Store in ai_messages
        await supabase.from("ai_messages").insert({
          user_id: user.id,
          message_date: tomorrowStr,
          content: text,
          message_type: "daily",
          habit_ids_referenced: habitContexts.map((h) => h.id),
          model_used: MODEL,
          prompt_tokens: inputTokens,
          completion_tokens: outputTokens,
        });

        // Send push notification if enabled
        if (user.notification_enabled) {
          const { data: tokens } = await supabase
            .from("notification_tokens")
            .select("token")
            .eq("user_id", user.id)
            .eq("is_active", true);

          for (const t of tokens ?? []) {
            await sendPushNotification(t.token, text);
          }
        }

        processed++;
      } catch (userErr) {
        console.error(`Error processing user ${user.id}:`, userErr);
        errors++;
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        processed,
        errors,
        date: tomorrowStr,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("daily-coach fatal error:", err);
    return new Response(
      JSON.stringify({ ok: false, error: String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
