import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, { params }: RouteContext) {
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
    .select("id, member_count")
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

  // Remove membership
  const { error: deleteError } = await supabase
    .from("group_members")
    .delete()
    .eq("group_id", groupId)
    .eq("user_id", user.id);

  if (deleteError) {
    console.error("Leave group error:", deleteError);
    return NextResponse.json(
      { error: "LEAVE_ERROR", message: "Failed to leave group." },
      { status: 500 }
    );
  }

  const newMemberCount = group.member_count - 1;

  if (newMemberCount <= 0) {
    // Last member — soft delete the group
    await supabase
      .from("groups")
      .update({ member_count: 0 })
      .eq("id", groupId);
  } else {
    await supabase
      .from("groups")
      .update({ member_count: newMemberCount })
      .eq("id", groupId);
  }

  return NextResponse.json({ success: true });
}
