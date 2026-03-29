import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { RegisterTokenSchema } from "@/lib/validations";

export async function POST(request: Request) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = RegisterTokenSchema.safeParse(body);

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

  const { token, platform } = parsed.data;

  // Check for existing token
  const { data: existing } = await supabase
    .from("notification_tokens")
    .select("id, token, platform, is_active, created_at")
    .eq("user_id", user.id)
    .eq("token", token)
    .single();

  if (existing) {
    // Re-activate if previously disabled
    if (!existing.is_active) {
      await supabase
        .from("notification_tokens")
        .update({ is_active: true })
        .eq("id", existing.id);
    }

    return NextResponse.json({
      id: existing.id,
      token: existing.token,
      platform: existing.platform,
      is_active: true,
      already_registered: true,
    });
  }

  const { data: newToken, error: insertError } = await supabase
    .from("notification_tokens")
    .insert({
      user_id: user.id,
      token,
      platform,
      is_active: true,
    })
    .select("id, token, platform, is_active, created_at")
    .single();

  if (insertError || !newToken) {
    // Handle unique constraint race condition
    if (insertError?.code === "23505") {
      return NextResponse.json({
        token,
        platform,
        is_active: true,
        already_registered: true,
      });
    }
    console.error("Token insert error:", insertError);
    return NextResponse.json(
      { error: "REGISTER_ERROR", message: "Failed to register token." },
      { status: 500 }
    );
  }

  return NextResponse.json(newToken, { status: 201 });
}

export async function DELETE(request: Request) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json(
      { error: "VALIDATION_ERROR", message: "token query param is required." },
      { status: 422 }
    );
  }

  const { data: existing } = await supabase
    .from("notification_tokens")
    .select("id")
    .eq("user_id", user.id)
    .eq("token", token)
    .single();

  if (!existing) {
    return NextResponse.json(
      { error: "NOT_FOUND", message: "Token not found." },
      { status: 404 }
    );
  }

  await supabase
    .from("notification_tokens")
    .update({ is_active: false })
    .eq("id", existing.id);

  return NextResponse.json({ success: true });
}
