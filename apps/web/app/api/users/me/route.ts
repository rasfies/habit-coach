import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { UpdateProfileSchema } from "@/lib/validations";

export async function GET() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile, error } = await supabase
    .from("users")
    .select(
      "id, email, display_name, avatar_url, onboarding_complete, notification_enabled, reminder_time, created_at"
    )
    .eq("id", user.id)
    .single();

  if (error || !profile) {
    return NextResponse.json(
      { error: "NOT_FOUND", message: "User profile not found." },
      { status: 404 }
    );
  }

  return NextResponse.json(profile);
}

export async function PATCH(request: Request) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = UpdateProfileSchema.safeParse(body);

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

  const updates: Record<string, unknown> = { ...parsed.data };

  const { data: updated, error } = await supabase
    .from("users")
    .update(updates)
    .eq("id", user.id)
    .select("id, display_name, avatar_url, notification_enabled, reminder_time, updated_at")
    .single();

  if (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { error: "UPDATE_ERROR", message: "Failed to update profile." },
      { status: 500 }
    );
  }

  return NextResponse.json(updated);
}
