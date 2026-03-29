import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

type RouteContext = { params: Promise<{ id: string }> };

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

  const { data: members, error } = await supabase
    .from("group_members")
    .select(
      `
      user_id,
      joined_at,
      users ( display_name, avatar_url )
    `
    )
    .eq("group_id", groupId);

  if (error) {
    console.error("Members fetch error:", error);
    return NextResponse.json(
      { error: "FETCH_ERROR", message: "Failed to fetch members." },
      { status: 500 }
    );
  }

  const result = (members ?? []).map((m) => {
    const userProfile = Array.isArray(m.users) ? m.users[0] : m.users;
    return {
      user_id: m.user_id,
      display_name: userProfile?.display_name ?? "",
      avatar_url: userProfile?.avatar_url ?? null,
      joined_at: m.joined_at,
    };
  });

  return NextResponse.json({ group_id: groupId, members: result });
}
