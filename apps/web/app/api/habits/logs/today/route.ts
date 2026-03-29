import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

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
  const date = searchParams.get("date") ?? todayUTC();

  // Fetch all active habits with today's logs
  const { data: habits, error } = await supabase
    .from("habits")
    .select(
      `
      id, name,
      habit_logs ( log_date, completed, is_grace_day )
    `
    )
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Today logs fetch error:", error);
    return NextResponse.json(
      { error: "FETCH_ERROR", message: "Failed to fetch today's logs." },
      { status: 500 }
    );
  }

  const logs = (habits ?? []).map((h) => {
    const allLogs = Array.isArray(h.habit_logs) ? h.habit_logs : [];
    const todayLog = allLogs.find((l) => l.log_date === date);

    return {
      habit_id: h.id,
      habit_name: h.name,
      completed: todayLog?.completed ?? false,
      is_grace_day: todayLog?.is_grace_day ?? false,
    };
  });

  return NextResponse.json({ date, logs });
}
