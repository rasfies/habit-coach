import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { UpdateNotificationPrefsSchema } from "@/lib/validations";

export async function GET() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("users")
    .select("notification_enabled, reminder_time")
    .eq("id", user.id)
    .single();

  const { data: devices } = await supabase
    .from("notification_tokens")
    .select("id, platform, is_active, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return NextResponse.json({
    notification_enabled: profile?.notification_enabled ?? true,
    reminder_time: profile?.reminder_time ?? null,
    registered_devices: devices ?? [],
  });
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
  const parsed = UpdateNotificationPrefsSchema.safeParse(body);

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

  const updates: Record<string, unknown> = {
    notification_enabled: parsed.data.notification_enabled,
  };

  if (parsed.data.reminder_time !== undefined) {
    updates.reminder_time = parsed.data.reminder_time;
  }

  const { error } = await supabase
    .from("users")
    .update(updates)
    .eq("id", user.id);

  if (error) {
    console.error("Notification prefs update error:", error);
    return NextResponse.json(
      { error: "UPDATE_ERROR", message: "Failed to update notification preferences." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    notification_enabled: parsed.data.notification_enabled,
    reminder_time: parsed.data.reminder_time ?? null,
  });
}
