import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  const { id: habitId } = await params;
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify habit ownership first
  const { data: habit, error: habitError } = await supabase
    .from("habits")
    .select("id")
    .eq("id", habitId)
    .eq("user_id", user.id)
    .single();

  if (habitError || !habit) {
    return NextResponse.json(
      { error: "NOT_FOUND", message: "Habit not found." },
      { status: 404 }
    );
  }

  const { data: streak, error } = await supabase
    .from("streaks")
    .select(
      "habit_id, current_streak, longest_streak, grace_days_used_this_week, last_completed_date, last_streak_reset"
    )
    .eq("habit_id", habitId)
    .eq("user_id", user.id)
    .single();

  if (error || !streak) {
    // Streak row may not exist yet (created on first log)
    return NextResponse.json({
      habit_id: habitId,
      current_streak: 0,
      longest_streak: 0,
      grace_days_used_this_week: 0,
      last_completed_date: null,
      last_streak_reset: null,
    });
  }

  return NextResponse.json(streak);
}
