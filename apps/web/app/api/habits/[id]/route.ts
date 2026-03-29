import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { UpdateHabitSchema } from "@/lib/validations";

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: habit, error } = await supabase
    .from("habits")
    .select(
      `
      id, name, icon, frequency, reminder_time, sort_order, is_active, created_at, updated_at,
      streaks ( current_streak, longest_streak, grace_days_used_this_week, last_completed_date ),
      habit_logs ( id, log_date, completed, is_grace_day )
    `
    )
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !habit) {
    return NextResponse.json(
      { error: "NOT_FOUND", message: "Habit not found." },
      { status: 404 }
    );
  }

  const today = todayUTC();
  const streak = Array.isArray(habit.streaks) ? habit.streaks[0] : habit.streaks;
  const logs = Array.isArray(habit.habit_logs) ? habit.habit_logs : [];
  const todayLog = logs.find((l) => l.log_date === today && l.completed);

  return NextResponse.json({
    id: habit.id,
    name: habit.name,
    icon: habit.icon,
    frequency: habit.frequency,
    reminder_time: habit.reminder_time,
    sort_order: habit.sort_order,
    is_active: habit.is_active,
    current_streak: streak?.current_streak ?? 0,
    longest_streak: streak?.longest_streak ?? 0,
    grace_days_used_this_week: streak?.grace_days_used_this_week ?? 0,
    completed_today: !!todayLog,
    created_at: habit.created_at,
    updated_at: habit.updated_at,
  });
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const { id } = await params;
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = UpdateHabitSchema.safeParse(body);

  if (!parsed.success) {
    const fields: Record<string, string> = {};
    parsed.error.errors.forEach((e) => {
      if (e.path[0]) fields[String(e.path[0])] = e.message;
    });
    return NextResponse.json(
      { error: "VALIDATION_ERROR", fields },
      { status: 422 }
    );
  }

  const { data: updated, error } = await supabase
    .from("habits")
    .update({ ...parsed.data })
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id, name, icon, reminder_time, sort_order, updated_at")
    .single();

  if (error || !updated) {
    return NextResponse.json(
      { error: "NOT_FOUND", message: "Habit not found." },
      { status: 404 }
    );
  }

  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await supabase
    .from("habits")
    .update({ is_active: false })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json(
      { error: "NOT_FOUND", message: "Habit not found." },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true });
}
