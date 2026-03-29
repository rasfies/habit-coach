import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { CreateHabitSchema } from "@/lib/validations";

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
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
  const activeOnly = searchParams.get("active_only") !== "false";

  let query = supabase
    .from("habits")
    .select(
      `
      id, name, icon, frequency, reminder_time, sort_order, is_active, created_at,
      streaks ( current_streak, longest_streak ),
      habit_logs ( id, log_date, completed )
    `
    )
    .eq("user_id", user.id)
    .order("sort_order", { ascending: true });

  if (activeOnly) {
    query = query.eq("is_active", true);
  }

  const { data: habits, error } = await query;

  if (error) {
    console.error("Habits fetch error:", error);
    return NextResponse.json(
      { error: "FETCH_ERROR", message: "Failed to fetch habits." },
      { status: 500 }
    );
  }

  const today = todayUTC();

  const result = (habits ?? []).map((h) => {
    const streak = Array.isArray(h.streaks) ? h.streaks[0] : h.streaks;
    const todayLog = Array.isArray(h.habit_logs)
      ? h.habit_logs.find((l) => l.log_date === today && l.completed)
      : null;

    return {
      id: h.id,
      name: h.name,
      icon: h.icon,
      frequency: h.frequency,
      reminder_time: h.reminder_time,
      sort_order: h.sort_order,
      is_active: h.is_active,
      current_streak: streak?.current_streak ?? 0,
      longest_streak: streak?.longest_streak ?? 0,
      completed_today: !!todayLog,
      created_at: h.created_at,
    };
  });

  return NextResponse.json({ habits: result });
}

export async function POST(request: Request) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = CreateHabitSchema.safeParse(body);

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

  // Enforce 10-habit limit
  const { count, error: countError } = await supabase
    .from("habits")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_active", true);

  if (countError) {
    return NextResponse.json(
      { error: "FETCH_ERROR", message: "Failed to check habit count." },
      { status: 500 }
    );
  }

  if ((count ?? 0) >= 10) {
    return NextResponse.json(
      {
        error: "HABIT_LIMIT_REACHED",
        message: "You can have a maximum of 10 active habits.",
      },
      { status: 422 }
    );
  }

  // Get max sort_order
  const { data: maxOrderRow } = await supabase
    .from("habits")
    .select("sort_order")
    .eq("user_id", user.id)
    .order("sort_order", { ascending: false })
    .limit(1)
    .single();

  const nextSortOrder = (maxOrderRow?.sort_order ?? -1) + 1;

  const { data: habit, error: insertError } = await supabase
    .from("habits")
    .insert({
      user_id: user.id,
      name: parsed.data.name,
      icon: parsed.data.icon ?? null,
      frequency: "daily",
      reminder_time: parsed.data.reminder_time ?? null,
      sort_order: nextSortOrder,
      is_active: true,
    })
    .select("id, name, icon, frequency, reminder_time, sort_order, is_active, created_at")
    .single();

  if (insertError || !habit) {
    console.error("Habit insert error:", insertError);
    return NextResponse.json(
      { error: "CREATE_ERROR", message: "Failed to create habit." },
      { status: 500 }
    );
  }

  // Create streak row
  await supabase.from("streaks").insert({
    habit_id: habit.id,
    user_id: user.id,
    current_streak: 0,
    longest_streak: 0,
    grace_days_used_this_week: 0,
    last_completed_date: null,
    last_streak_reset: null,
  });

  return NextResponse.json(
    {
      ...habit,
      current_streak: 0,
      longest_streak: 0,
      completed_today: false,
    },
    { status: 201 }
  );
}
