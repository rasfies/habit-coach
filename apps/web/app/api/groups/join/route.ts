import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { JoinGroupSchema } from "@/lib/validations";

export async function POST(request: Request) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = JoinGroupSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "VALIDATION_ERROR", message: "invite_code is required." },
      { status: 422 }
    );
  }

  const { invite_code } = parsed.data;

  // Case-insensitive lookup
  const { data: group, error: groupError } = await supabase
    .from("groups")
    .select("id, name, member_count")
    .ilike("invite_code", invite_code.trim())
    .single();

  if (groupError || !group) {
    return NextResponse.json(
      {
        error: "INVALID_INVITE_CODE",
        message: "This invite code is not valid.",
      },
      { status: 404 }
    );
  }

  // Check if already a member
  const { data: existingMembership } = await supabase
    .from("group_members")
    .select("id, joined_at")
    .eq("group_id", group.id)
    .eq("user_id", user.id)
    .single();

  if (existingMembership) {
    return NextResponse.json({
      group_id: group.id,
      group_name: group.name,
      already_member: true,
    });
  }

  // Insert membership
  const { data: membership, error: memberError } = await supabase
    .from("group_members")
    .insert({
      group_id: group.id,
      user_id: user.id,
    })
    .select("joined_at")
    .single();

  if (memberError) {
    // Handle unique constraint (race condition)
    if (memberError.code === "23505") {
      return NextResponse.json({
        group_id: group.id,
        group_name: group.name,
        already_member: true,
      });
    }
    console.error("Join group error:", memberError);
    return NextResponse.json(
      { error: "JOIN_ERROR", message: "Failed to join group." },
      { status: 500 }
    );
  }

  // Note: member_count is updated automatically by the DB trigger
  // (group_members_count trigger on group_members INSERT/DELETE)

  return NextResponse.json({
    group_id: group.id,
    group_name: group.name,
    joined_at: membership?.joined_at,
  });
}
