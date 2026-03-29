import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function getMondayOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d;
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
  const monthParam = searchParams.get("month"); // YYYY-MM

  let year: number;
  let month: number; // 0-indexed

  if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
    const [y, m] = monthParam.split("-").map(Number);
    year = y;
    month = m - 1;
  } else {
    const now = new Date();
    year = now.getUTCFullYear();
    month = now.getUTCMonth();
  }

  const periodStart = new Date(Date.UTC(year, month, 1));
  const periodEnd = new Date(Date.UTC(year, month + 1, 0)); // last day of month

  const periodStartStr = toDateStr(periodStart);
  const periodEndStr = toDateStr(periodEnd);

  const today = toDateStr(new Date());
  const isCurrentMonth = today >= periodStartStr && today <= periodEndStr;
  const isPastMonth = today > periodEndStr;

  // For past months, check if we have analytics snapshots
  if (isPastMonth) {
    const { data: snapshots } = await supabase
      .from("analytics_snapshots")
      .select(
        "habit_id, completion_rate, days_completed, days_possible, streak_at_end, habits ( name )"
      )
      .eq("user_id", user.id)
      .eq("snapshot_type", "monthly")
      .eq("period_start", periodStartStr);

    if (snapshots && snapshots.length > 0) {
      // Serve from snapshots
      const habitResults = snapshots.map((s) => {
        const habit = Array.isArray(s.habits) ? s.habits[0] : s.habits;
        return {
          habit_id: s.habit_id,
          habit_name: habit?.name ?? "",
          completion_rate: Number(s.completion_rate),
          days_completed: s.days_completed,
          days_possible: s.days_possible,
          streak_at_end: s.streak_at_end,
          weekly_breakdown: [], // not stored in snapshot — omitted for past months
        };
      });

      const totalCompleted = habitResults.reduce((s, h) => s + h.days_completed, 0);
      const totalPossible = habitResults.reduce((s, h) => s + h.days_possible, 0);

      return NextResponse.json({
        period_start: periodStartStr,
        period_end: periodEndStr,
        overall_completion_rate:
          totalPossible > 0
            ? Math.round((totalCompleted / totalPossible) * 10000) / 100
            : 0,
        habits: habitResults,
      });
    }
  }

  // Compute live from habit_logs
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

  // Build all dates in period
  const allDates: string[] = [];
  const cursor = new Date(periodStart);
  while (cursor <= periodEnd) {
    allDates.push(toDateStr(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  // Build weekly buckets
  const weekBuckets: Array<{ start: Date; end: Date }> = [];
  let weekCursor = getMondayOfWeek(periodStart);
  while (weekCursor <= periodEnd) {
    const weekEnd = new Date(weekCursor);
    weekEnd.setUTCDate(weekEnd.getUTCDate() + 6);
    weekBuckets.push({ start: new Date(weekCursor), end: weekEnd });
    weekCursor.setUTCDate(weekCursor.getUTCDate() + 7);
  }

  const habitResults = (habits ?? []).map((h) => {
    const habitCreatedDate = h.created_at.slice(0, 10);
    const streak = Array.isArray(h.streaks) ? h.streaks[0] : h.streaks;
    const effectiveStartStr =
      habitCreatedDate > periodStartStr ? habitCreatedDate : periodStartStr;

    const habitLogs = (logs ?? []).filter((l) => l.habit_id === h.id);
    const logMap = new Map(habitLogs.map((l) => [l.log_date, l]));

    const activeDates = allDates.filter(
      (d) => d >= effectiveStartStr && d <= today
    );
    const daysCompleted = activeDates.filter((d) => logMap.get(d)?.completed).length;
    const daysPossible = activeDates.length;
    const completionRate =
      daysPossible > 0
        ? Math.round((daysCompleted / daysPossible) * 10000) / 100
        : 0;

    // Weekly breakdown
    const weeklyBreakdown = weekBuckets
      .filter((w) => toDateStr(w.start) <= periodEndStr && toDateStr(w.end) >= effectiveStartStr)
      .map((w) => {
        const wStartStr = toDateStr(w.start);
        const wEndStr = toDateStr(w.end);
        const weekDates = allDates.filter(
          (d) =>
            d >= wStartStr &&
            d <= wEndStr &&
            d >= effectiveStartStr &&
            d <= today
        );
        const wCompleted = weekDates.filter((d) => logMap.get(d)?.completed).length;
        const wRate =
          weekDates.length > 0
            ? Math.round((wCompleted / weekDates.length) * 10000) / 100
            : 0;
        return {
          week_start: wStartStr,
          week_end: wEndStr,
          completion_rate: wRate,
          days_completed: wCompleted,
        };
      });

    return {
      habit_id: h.id,
      habit_name: h.name,
      completion_rate: completionRate,
      days_completed: daysCompleted,
      days_possible: daysPossible,
      streak_at_end: streak?.current_streak ?? 0,
      weekly_breakdown: weeklyBreakdown,
    };
  });

  const totalCompleted = habitResults.reduce((s, h) => s + h.days_completed, 0);
  const totalPossible = habitResults.reduce((s, h) => s + h.days_possible, 0);

  return NextResponse.json({
    period_start: periodStartStr,
    period_end: periodEndStr,
    overall_completion_rate:
      totalPossible > 0
        ? Math.round((totalCompleted / totalPossible) * 10000) / 100
        : 0,
    habits: habitResults,
  });
}
