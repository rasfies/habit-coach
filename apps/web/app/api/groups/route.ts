import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { CreateGroupSchema } from "@/lib/validations";

function generateInviteCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

async function generateUniqueInviteCode(
  supabase: Awaited<ReturnType<typeof createServerClient>>
): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = generateInviteCode();
    const { data } = await supabase
      .from("groups")
      .select("id")
      .eq("invite_code", code)
      .single();

    if (!data) return code; // no collision
  }
  // Extremely unlikely — fallback with timestamp entropy
  return generateInviteCode() + Date.now().toString(36).slice(-2).toUpperCase();
}

export async function GET() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: memberships, error } = await supabase
    .from("group_members")
    .select(
      `
      joined_at,
      groups ( id, name, invite_code, member_count, created_by, created_at )
    `
    )
    .eq("user_id", user.id);

  if (error) {
    console.error("Groups fetch error:", error);
    return NextResponse.json(
      { error: "FETCH_ERROR", message: "Failed to fetch groups." },
      { status: 500 }
    );
  }

  const groups = (memberships ?? []).map((m) => {
    const g = Array.isArray(m.groups) ? m.groups[0] : m.groups;
    return {
      id: g?.id,
      name: g?.name,
      invite_code: g?.invite_code,
      member_count: g?.member_count,
      created_by: g?.created_by,
      joined_at: m.joined_at,
      created_at: g?.created_at,
    };
  });

  return NextResponse.json({ groups });
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
  const parsed = CreateGroupSchema.safeParse(body);

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

  const inviteCode = await generateUniqueInviteCode(supabase);

  const { data: group, error: groupError } = await supabase
    .from("groups")
    .insert({
      name: parsed.data.name,
      invite_code: inviteCode,
      created_by: user.id,
      member_count: 1,
    })
    .select("id, name, invite_code, member_count, created_by, created_at")
    .single();

  if (groupError || !group) {
    console.error("Group create error:", groupError);
    return NextResponse.json(
      { error: "CREATE_ERROR", message: "Failed to create group." },
      { status: 500 }
    );
  }

  // Add creator as first member
  await supabase.from("group_members").insert({
    group_id: group.id,
    user_id: user.id,
  });

  return NextResponse.json(group, { status: 201 });
}
