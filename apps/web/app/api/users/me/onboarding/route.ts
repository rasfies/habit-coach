import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { OnboardingSchema } from "@/lib/validations";

export async function PATCH(request: Request) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = OnboardingSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "VALIDATION_ERROR",
        message: "onboarding_complete must be true.",
      },
      { status: 422 }
    );
  }

  const { error } = await supabase
    .from("users")
    .update({ onboarding_complete: true })
    .eq("id", user.id);

  if (error) {
    console.error("Onboarding update error:", error);
    return NextResponse.json(
      { error: "UPDATE_ERROR", message: "Failed to complete onboarding." },
      { status: 500 }
    );
  }

  // Trigger Day 1 AI message generation asynchronously (fire and forget).
  // We call this inline but don't await it — the client polls /api/coaching/today.
  // Import inline to avoid circular deps at module load time.
  import("@/lib/ai-coach").then(async ({ generateDailyCoachingMessage }) => {
    try {
      const { createServiceRoleClient } = await import("@/lib/supabase-server");
      const serviceClient = await createServiceRoleClient();

      const { data: profile } = await supabase
        .from("users")
        .select("display_name")
        .eq("id", user.id)
        .single();

      const { data: habitsData } = await supabase
        .from("habits")
        .select("id, name, streaks ( current_streak, longest_streak )")
        .eq("user_id", user.id)
        .eq("is_active", true);

      const habits = (habitsData ?? []).map((h) => {
        const streak = Array.isArray(h.streaks) ? h.streaks[0] : h.streaks;
        return {
          id: h.id,
          name: h.name,
          currentStreak: streak?.current_streak ?? 0,
          longestStreak: streak?.longest_streak ?? 0,
          completedToday: false,
        };
      });

      const today = new Date().toISOString().slice(0, 10);
      const displayName = profile?.display_name ?? "there";

      const result = await generateDailyCoachingMessage(
        displayName,
        habits,
        [],
        "day1_welcome"
      );

      await serviceClient.from("ai_messages").insert({
        user_id: user.id,
        message_date: today,
        content: result.text,
        message_type: "day1_welcome",
        habit_ids_referenced: habits.map((h) => h.id),
        model_used: result.model,
        prompt_tokens: result.inputTokens,
        completion_tokens: result.outputTokens,
      });
    } catch (err) {
      console.error("Failed to generate Day 1 message:", err);
    }
  }).catch(() => { /* ignore import errors */ });

  return NextResponse.json({ onboarding_complete: true });
}
