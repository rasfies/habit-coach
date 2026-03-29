import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

type RouteContext = { params: Promise<{ id: string }> };

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function GET(_request: Request, { params }: RouteContext) {
  const { id: groupId } = await params;
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify membership
  const { data: membership } = await supabase
    .from("group_members")
    .select("id")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .single();

  if (!membership) {
    return NextResponse.json(
      { error: "FORBIDDEN", message: "You are not a member of this group." },
      { status: 403 }
    );
  }

  // Fetch all members with display info
  const { data: members, error: membersError } = await supabase
    .from("group_members")
    .select(
      `
      user_id,
      users ( display_name, avatar_url )
    `
    )
    .eq("group_id", groupId);

  if (membersError) {
    console.error("Group members fetch error:", membersError);
    return NextResponse.json(
      { error: "FETCH_ERROR", message: "Failed to fetch group members." },
      { status: 500 }
    );
  }

  const memberUserIds = (members ?? []).map((m) => m.user_id);
  const today = todayUTC();

  // Fetch all active habits for all members in a single query
  const { data: habitsData, error: habitsError } = await supabase
    .from("habits")
    .select(
      `
      id, name, user_id,
      streaks ( current_streak, longest_streak ),
      habit_logs ( log_date, completed )
    `
    )
    .in("user_id", memberUserIds)
    .eq("is_active", true);

  if (habitsError) {
    console.error("Group streaks habits fetch error:", habitsError);
    return NextResponse.json(
      { error: "FETCH_ERROR", message: "Failed to fetch group streaks." },
      { status: 500 }
    );
  }

  // Group habits by user_id
  type HabitEntry = {
    habit_id: string;
    habit_name: string;
    current_streak: number;
    longest_streak: number;
    completed_today: boolean;
  };

  const habitsByUser = new Map<string, HabitEntry[]>();

  for (const h of habitsData ?? []) {
    const streak = Array.isArray(h.streaks) ? h.streaks[0] : h.streaks;
    const logs = Array.isArray(h.habit_logs) ? h.habit_logs : [];
    const completedToday = logs.some(
      (l) => l.log_date === today && l.completed
    );

    if (!habitsByUser.has(h.user_id)) {
      habitsByUser.set(h.user_id, []);
    }
    habitsByUser.get(h.user_id)!.push({
      habit_id: h.id,
      habit_name: h.name,
      current_streak: streak?.current_streak ?? 0,
      longest_streak: streak?.longest_streak ?? 0,
      completed_today: completedToday,
    });
  }

  // Build leaderboard sorted by total current streak descending
  const memberStreaks = (members ?? [])
    .map((m) => {
      const userProfile = Array.isArray(m.users) ? m.users[0] : m.users;
      const habits = habitsByUser.get(m.user_id) ?? [];
      const totalStreak = habits.reduce((s, h) => s + h.current_streak, 0);

      return {
        user_id: m.user_id,
        display_name: userProfile?.display_name ?? "",
        avatar_url: userProfile?.avatar_url ?? null,
        habits,
        _totalStreak: totalStreak,
      };
    })
    .sort((a, b) => b._totalStreak - a._totalStreak)
    .map(({ _totalStreak: _, ...rest }) => rest);

  return NextResponse.json({
    group_id: groupId,
    date: today,
    member_streaks: memberStreaks,
  });
}
