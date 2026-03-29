import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

type RouteContext = { params: Promise<{ token: string }> };

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { token } = await params;
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: existing } = await supabase
    .from("notification_tokens")
    .select("id")
    .eq("user_id", user.id)
    .eq("token", decodeURIComponent(token))
    .single();

  if (!existing) {
    return NextResponse.json(
      { error: "NOT_FOUND", message: "Token not found." },
      { status: 404 }
    );
  }

  const { error } = await supabase
    .from("notification_tokens")
    .update({ is_active: false })
    .eq("id", existing.id);

  if (error) {
    console.error("Token deactivation error:", error);
    return NextResponse.json(
      { error: "UPDATE_ERROR", message: "Failed to remove token." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
