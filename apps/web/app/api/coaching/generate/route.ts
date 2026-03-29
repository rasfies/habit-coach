import { NextResponse } from "next/server";
import { createServerClient, createServiceRoleClient } from "@/lib/supabase-server";
import { GenerateMessageSchema } from "@/lib/validations";
import { generateDailyCoachingMessage } from "@/lib/ai-coach";
import type { HabitContext } from "@/lib/ai-coach";
import type { HabitLog } from "@habit-coach/db";

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

function sevenDaysAgoUTC(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 7);
  return d.toISOString().slice(0, 10);
}

export async function POST(request: Request) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = GenerateMessageSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "VALIDATION_ERROR", message: "Invalid request body." },
      { status: 422 }
    );
  }

  const { message_type, habit_id } = parsed.data;
  const today = todayUTC();

  // Idempotency guard — check if message already exists for today
  const { data: existingMessage } = await supabase
    .from("ai_messages")
    .select("id")
    .eq("user_id", user.id)
    .eq("message_date", today)
    .eq("message_type", message_type)
    .single();

  if (existingMessage) {
    return NextResponse.json(
      {
        error: "MESSAGE_ALREADY_EXISTS",
        message: "A coaching message already exists for today.",
      },
      { status: 409 }
    );
  }

  // Rate limit: max 2 manual generate calls per user per day
  const { count: todayCount } = await supabase
    .from("ai_messages")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("message_date", today);

  if ((todayCount ?? 0) >= 2) {
    return NextResponse.json(
      {
        error: "RATE_LIMITED",
        message: "Too many requests. Please wait before trying again.",
        retry_after_seconds: 3600,
      },
      { status: 429 }
    );
  }

  // Fetch user profile
  const { data: profile } = await supabase
    .from("users")
    .select("display_name")
    .eq("id", user.id)
    .single();

  const displayName = profile?.display_name ?? "there";

  // Fetch active habits with streak data
  const { data: habitsData } = await supabase
    .from("habits")
    .select(
      `
      id, name,
      streaks ( current_streak, longest_streak ),
      habit_logs ( log_date, completed )
    `
    )
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  const today_str = todayUTC();
  const habits: HabitContext[] = (habitsData ?? []).map((h) => {
    const streak = Array.isArray(h.streaks) ? h.streaks[0] : h.streaks;
    const logs = Array.isArray(h.habit_logs) ? h.habit_logs : [];
    const completedToday = logs.some((l) => l.log_date === today_str && l.completed);

    return {
      id: h.id,
      name: h.name,
      currentStreak: streak?.current_streak ?? 0,
      longestStreak: streak?.longest_streak ?? 0,
      completedToday,
    };
  });

  // Fetch recent logs (last 7 days)
  const { data: recentLogsData } = await supabase
    .from("habit_logs")
    .select("id, habit_id, user_id, log_date, completed, is_grace_day, created_at")
    .eq("user_id", user.id)
    .gte("log_date", sevenDaysAgoUTC())
    .eq("completed", true);

  const recentLogs = (recentLogsData ?? []) as HabitLog[];

  // Find milestone habit name if needed
  let milestoneHabitName: string | undefined;
  if (habit_id && (message_type === "streak_3" || message_type === "streak_7")) {
    const milestoneHabit = habits.find((h) => h.id === habit_id);
    milestoneHabitName = milestoneHabit?.name;
  }

  // Generate the message (async — but we await it here so we can store it)
  // The route returns 202 immediately via the response pattern above;
  // generation happens synchronously so the stored message is ready when polled.
  let generationResult: Awaited<ReturnType<typeof generateDailyCoachingMessage>>;
  try {
    generationResult = await generateDailyCoachingMessage(
      displayName,
      habits,
      recentLogs,
      message_type,
      milestoneHabitName
    );
  } catch (err) {
    console.error("Claude generation error:", err);
    return NextResponse.json(
      { error: "GENERATION_ERROR", message: "Failed to generate coaching message." },
      { status: 500 }
    );
  }

  // Store in ai_messages using service role (bypasses RLS on INSERT)
  const serviceClient = await createServiceRoleClient();
  const habitIdsReferenced = habits.map((h) => h.id);

  const { error: insertError } = await serviceClient
    .from("ai_messages")
    .insert({
      user_id: user.id,
      message_date: today,
      content: generationResult.text,
      message_type,
      habit_ids_referenced: habitIdsReferenced,
      model_used: generationResult.model,
      prompt_tokens: generationResult.inputTokens,
      completion_tokens: generationResult.outputTokens,
    });

  if (insertError) {
    // If it's a unique constraint violation, the message was already inserted
    // (race condition with cron job) — that's fine
    if (insertError.code !== "23505") {
      console.error("AI message insert error:", insertError);
    }
  }

  return NextResponse.json(
    {
      status: "queued",
      estimated_seconds: 5,
    },
    { status: 202 }
  );
}
