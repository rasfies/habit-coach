import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

function getMondayOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getUTCDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d;
}

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export async function GET(request: Request) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const weekStartParam = searchParams.get("week_start");

  let periodStart: Date;
  if (weekStartParam) {
    periodStart = getMondayOfWeek(new Date(`${weekStartParam}T00:00:00.000Z`));
  } else {
    periodStart = getMondayOfWeek(new Date());
  }

  const periodEnd = new Date(periodStart);
  periodEnd.setUTCDate(periodEnd.getUTCDate() + 6);

  const periodStartStr = toDateStr(periodStart);
  const periodEndStr = toDateStr(periodEnd);

  // Fetch active habits
  const { data: habits, error: habitsError } = await supabase
    .from("habits")
    .select("id, name, created_at, streaks ( current_streak )")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (habitsError) {
    return NextResponse.json(
      { error: "FETCH_ERROR", message: "Failed to fetch habits." },
      { status: 500 }
    );
  }

  // Fetch logs for the period
  const { data: logs, error: logsError } = await supabase
    .from("habit_logs")
    .select("habit_id, log_date, completed, is_grace_day")
    .eq("user_id", user.id)
    .gte("log_date", periodStartStr)
    .lte("log_date", periodEndStr);

  if (logsError) {
    return NextResponse.json(
      { error: "FETCH_ERROR", message: "Failed to fetch logs." },
      { status: 500 }
    );
  }

  // Build daily breakdown for each habit
  const allDates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(periodStart);
    d.setUTCDate(d.getUTCDate() + i);
    allDates.push(toDateStr(d));
  }

  const habitResults = (habits ?? []).map((h) => {
    const habitCreatedDate = h.created_at.slice(0, 10);
    const streak = Array.isArray(h.streaks) ? h.streaks[0] : h.streaks;

    // days_possible: from max(period_start, created_at) to period_end
    const effectiveStart =
      habitCreatedDate > periodStartStr ? habitCreatedDate : periodStartStr;
    const daysPossible = allDates.filter((d) => d >= effectiveStart).length;

    const habitLogs = (logs ?? []).filter((l) => l.habit_id === h.id);
    const logMap = new Map(habitLogs.map((l) => [l.log_date, l]));

    const dailyBreakdown = allDates
      .filter((d) => d >= effectiveStart)
      .map((date) => {
        const log = logMap.get(date);
        return {
          date,
          completed: log?.completed ?? false,
          is_grace_day: log?.is_grace_day ?? false,
        };
      });

    const daysCompleted = dailyBreakdown.filter((d) => d.completed).length;
    const completionRate =
      daysPossible > 0
        ? Math.round((daysCompleted / daysPossible) * 10000) / 100
        : 0;

    return {
      habit_id: h.id,
      habit_name: h.name,
      completion_rate: completionRate,
      days_completed: daysCompleted,
      days_possible: daysPossible,
      streak_at_end: streak?.current_streak ?? 0,
      daily_breakdown: dailyBreakdown,
    };
  });

  // Overall completion rate
  const totalDaysCompleted = habitResults.reduce(
    (s, h) => s + h.days_completed,
    0
  );
  const totalDaysPossible = habitResults.reduce(
    (s, h) => s + h.days_possible,
    0
  );
  const overallCompletionRate =
    totalDaysPossible > 0
      ? Math.round((totalDaysCompleted / totalDaysPossible) * 10000) / 100
      : 0;

  return NextResponse.json({
    period_start: periodStartStr,
    period_end: periodEndStr,
    overall_completion_rate: overallCompletionRate,
    habits: habitResults,
  });
}
