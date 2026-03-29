import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

function getMondayOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d;
}

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export async function GET() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch all active habits with streaks
  const { data: habits, error: habitsError } = await supabase
    .from("habits")
    .select("id, name, streaks ( current_streak, longest_streak )")
    .eq("user_id", user.id)
    .eq("is_active", true);

  if (habitsError) {
    return NextResponse.json(
      { error: "FETCH_ERROR", message: "Failed to fetch habits." },
      { status: 500 }
    );
  }

  const habitList = habits ?? [];

  // Best current streak
  let bestCurrentStreak = { habit_id: "", habit_name: "", current_streak: 0 };
  let allTimeBestStreak = { habit_id: "", habit_name: "", longest_streak: 0 };

  for (const h of habitList) {
    const streak = Array.isArray(h.streaks) ? h.streaks[0] : h.streaks;
    if ((streak?.current_streak ?? 0) > bestCurrentStreak.current_streak) {
      bestCurrentStreak = {
        habit_id: h.id,
        habit_name: h.name,
        current_streak: streak?.current_streak ?? 0,
      };
    }
    if ((streak?.longest_streak ?? 0) > allTimeBestStreak.longest_streak) {
      allTimeBestStreak = {
        habit_id: h.id,
        habit_name: h.name,
        longest_streak: streak?.longest_streak ?? 0,
      };
    }
  }

  // This week's completion rate
  const now = new Date();
  const weekStart = getMondayOfWeek(now);
  const weekStartStr = toDateStr(weekStart);
  const todayStr = toDateStr(now);

  // This month's range
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const monthStartStr = toDateStr(monthStart);

  const habitIds = habitList.map((h) => h.id);

  if (habitIds.length === 0) {
    return NextResponse.json({
      total_habits_active: 0,
      best_current_streak: null,
      all_time_best_streak: null,
      this_week_completion_rate: 0,
      this_month_completion_rate: 0,
      total_completions_all_time: 0,
    });
  }

  // Fetch all logs for summary calculation
  const { data: allLogs } = await supabase
    .from("habit_logs")
    .select("habit_id, log_date, completed")
    .eq("user_id", user.id)
    .eq("completed", true)
    .in("habit_id", habitIds);

  const logs = allLogs ?? [];

  // All time completions
  const totalCompletions = logs.length;

  // This week
  const weekLogs = logs.filter(
    (l) => l.log_date >= weekStartStr && l.log_date <= todayStr
  );
  const uniqueWeekDays = new Set(weekLogs.map((l) => l.log_date)).size;
  const weekDaysPossible =
    Math.ceil(
      (now.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24)
    ) + 1;
  const weekTotalPossible = weekDaysPossible * habitList.length;
  const weekCompletionRate =
    weekTotalPossible > 0
      ? Math.round((weekLogs.length / weekTotalPossible) * 10000) / 100
      : 0;

  // This month
  const monthLogs = logs.filter(
    (l) => l.log_date >= monthStartStr && l.log_date <= todayStr
  );
  const monthDaysPossible =
    Math.ceil(
      (now.getTime() - monthStart.getTime()) / (1000 * 60 * 60 * 24)
    ) + 1;
  const monthTotalPossible = monthDaysPossible * habitList.length;
  const monthCompletionRate =
    monthTotalPossible > 0
      ? Math.round((monthLogs.length / monthTotalPossible) * 10000) / 100
      : 0;

  return NextResponse.json({
    total_habits_active: habitList.length,
    best_current_streak:
      bestCurrentStreak.current_streak > 0 ? bestCurrentStreak : null,
    all_time_best_streak:
      allTimeBestStreak.longest_streak > 0 ? allTimeBestStreak : null,
    this_week_completion_rate: weekCompletionRate,
    this_month_completion_rate: monthCompletionRate,
    total_completions_all_time: totalCompletions,
  });
}
