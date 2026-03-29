import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { LogHabitSchema } from "@/lib/validations";
import { calculateStreak, isMilestone } from "@/lib/streak";
import type { HabitLog } from "@habit-coach/db";

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: RouteContext) {
  const { id: habitId } = await params;
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = LogHabitSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "VALIDATION_ERROR", message: "Invalid log_date format." },
      { status: 422 }
    );
  }

  const logDate = parsed.data.log_date ?? todayUTC();

  // Verify habit ownership
  const { data: habit, error: habitError } = await supabase
    .from("habits")
    .select("id, user_id, is_active")
    .eq("id", habitId)
    .eq("user_id", user.id)
    .single();

  if (habitError || !habit) {
    return NextResponse.json(
      { error: "NOT_FOUND", message: "Habit not found." },
      { status: 404 }
    );
  }

  // Check for existing log (idempotency)
  const { data: existingLog } = await supabase
    .from("habit_logs")
    .select("id, log_date, completed, is_grace_day")
    .eq("habit_id", habitId)
    .eq("log_date", logDate)
    .single();

  if (existingLog?.completed) {
    // Idempotent — return existing data
    const { data: streak } = await supabase
      .from("streaks")
      .select("current_streak")
      .eq("habit_id", habitId)
      .single();

    return NextResponse.json({
      id: existingLog.id,
      habit_id: habitId,
      log_date: logDate,
      completed: true,
      is_grace_day: existingLog.is_grace_day,
      current_streak: streak?.current_streak ?? 0,
      streak_milestone: null,
    });
  }

  // Fetch all logs to recalculate streak
  const { data: allLogs } = await supabase
    .from("habit_logs")
    .select("id, habit_id, user_id, log_date, completed, is_grace_day, created_at")
    .eq("habit_id", habitId)
    .order("log_date", { ascending: false });

  const logs = (allLogs ?? []) as HabitLog[];

  // Determine if this is a grace day (check before inserting)
  const today = new Date(`${logDate}T00:00:00.000Z`);
  const previousStreak = calculateStreak(logs, today);
  const isGraceLog = false; // Logging today is not a grace day — it's completion

  // Insert the new log
  const { data: newLog, error: insertError } = await supabase
    .from("habit_logs")
    .insert({
      habit_id: habitId,
      user_id: user.id,
      log_date: logDate,
      completed: true,
      is_grace_day: isGraceLog,
    })
    .select("id, log_date, completed, is_grace_day")
    .single();

  if (insertError) {
    // Handle unique constraint violation (race condition)
    if (insertError.code === "23505") {
      return NextResponse.json(
        {
          error: "ALREADY_LOGGED",
          message: "This habit has already been logged for today.",
        },
        { status: 409 }
      );
    }
    console.error("Log insert error:", insertError);
    return NextResponse.json(
      { error: "LOG_ERROR", message: "Failed to log habit." },
      { status: 500 }
    );
  }

  // Recalculate streak with the new log included
  const allLogsWithNew: HabitLog[] = [
    {
      id: newLog.id,
      habit_id: habitId,
      user_id: user.id,
      log_date: logDate,
      completed: true,
      is_grace_day: false,
      created_at: new Date().toISOString(),
    },
    ...logs,
  ];

  const newStreak = calculateStreak(allLogsWithNew, today);

  // Update streaks table
  await supabase
    .from("streaks")
    .update({
      current_streak: newStreak.current,
      longest_streak: newStreak.longest,
      grace_days_used_this_week: newStreak.graceDaysUsed,
      last_completed_date: logDate,
      last_streak_reset: newStreak.lastStreakReset,
    })
    .eq("habit_id", habitId)
    .eq("user_id", user.id);

  // Detect milestone (only if streak increased from previous)
  let streakMilestone: number | null = null;
  if (
    newStreak.current > previousStreak.current &&
    isMilestone(newStreak.current)
  ) {
    streakMilestone = newStreak.current;
  }

  return NextResponse.json({
    id: newLog.id,
    habit_id: habitId,
    log_date: logDate,
    completed: true,
    is_grace_day: false,
    current_streak: newStreak.current,
    streak_milestone: streakMilestone,
  });
}

export async function GET(request: Request, { params }: RouteContext) {
  const { id: habitId } = await params;
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  if (!from || !to) {
    return NextResponse.json(
      { error: "INVALID_DATE_RANGE", message: "Both 'from' and 'to' query params are required." },
      { status: 400 }
    );
  }

  // Validate date range (max 31 days)
  const fromDate = new Date(`${from}T00:00:00.000Z`);
  const toDate = new Date(`${to}T00:00:00.000Z`);
  const diffMs = toDate.getTime() - fromDate.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays > 31 || diffDays < 0) {
    return NextResponse.json(
      {
        error: "INVALID_DATE_RANGE",
        message: "Date range cannot exceed 31 days.",
      },
      { status: 400 }
    );
  }

  // Verify habit ownership
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

  const { data: logs, error } = await supabase
    .from("habit_logs")
    .select("id, log_date, completed, is_grace_day, created_at")
    .eq("habit_id", habitId)
    .gte("log_date", from)
    .lte("log_date", to)
    .order("log_date", { ascending: true });

  if (error) {
    return NextResponse.json(
      { error: "FETCH_ERROR", message: "Failed to fetch logs." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    habit_id: habitId,
    logs: logs ?? [],
  });
}
