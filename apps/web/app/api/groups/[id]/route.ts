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

  // Check group exists
  const { data: group, error: groupError } = await supabase
    .from("groups")
    .select("id, name, invite_code, member_count, created_by, created_at")
    .eq("id", groupId)
    .single();

  if (groupError || !group) {
    return NextResponse.json(
      { error: "NOT_FOUND", message: "Group not found." },
      { status: 404 }
    );
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

  // Fetch all members with their display info
  const { data: members, error: membersError } = await supabase
    .from("group_members")
    .select(
      `
      user_id,
      joined_at,
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

  // Fetch all active habits for all members with streak data
  const { data: habitsData } = await supabase
    .from("habits")
    .select(
      `
      id, name, user_id, is_active,
      streaks ( current_streak ),
      habit_logs ( log_date, completed )
    `
    )
    .in("user_id", memberUserIds)
    .eq("is_active", true);

  // Build member map
  const habitsByUser = new Map<
    string,
    Array<{
      habit_id: string;
      habit_name: string;
      current_streak: number;
      completed_today: boolean;
    }>
  >();

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
      completed_today: completedToday,
    });
  }

  const membersResult = (members ?? []).map((m) => {
    const userProfile = Array.isArray(m.users) ? m.users[0] : m.users;
    return {
      user_id: m.user_id,
      display_name: userProfile?.display_name ?? "",
      avatar_url: userProfile?.avatar_url ?? null,
      joined_at: m.joined_at,
      habits: habitsByUser.get(m.user_id) ?? [],
    };
  });

  return NextResponse.json({
    ...group,
    members: membersResult,
  });
}
