import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

export async function GET() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: streaks, error } = await supabase
    .from("streaks")
    .select(
      `
      habit_id,
      current_streak,
      longest_streak,
      grace_days_used_this_week,
      last_completed_date,
      habits ( name, is_active )
    `
    )
    .eq("user_id", user.id);

  if (error) {
    console.error("Streaks fetch error:", error);
    return NextResponse.json(
      { error: "FETCH_ERROR", message: "Failed to fetch streaks." },
      { status: 500 }
    );
  }

  const result = (streaks ?? [])
    .filter((s) => {
      const habit = Array.isArray(s.habits) ? s.habits[0] : s.habits;
      return habit?.is_active;
    })
    .map((s) => {
      const habit = Array.isArray(s.habits) ? s.habits[0] : s.habits;
      return {
        habit_id: s.habit_id,
        habit_name: habit?.name ?? "",
        current_streak: s.current_streak,
        longest_streak: s.longest_streak,
        grace_days_used_this_week: s.grace_days_used_this_week,
        last_completed_date: s.last_completed_date,
      };
    });

  return NextResponse.json({ streaks: result });
}
