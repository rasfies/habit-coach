import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function GET(request: Request) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") ?? todayUTC();

  // Check cache first
  const { data: message, error } = await supabase
    .from("ai_messages")
    .select("id, message_date, content, message_type, created_at")
    .eq("user_id", user.id)
    .eq("message_date", date)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("AI message fetch error:", error);
    return NextResponse.json(
      { error: "FETCH_ERROR", message: "Failed to fetch coaching message." },
      { status: 500 }
    );
  }

  if (message) {
    return NextResponse.json(message);
  }

  // No message for today — check if it's today (can generate) or past (no message)
  const isToday = date === todayUTC();

  if (!isToday) {
    return NextResponse.json(
      { error: "NOT_FOUND", message: "No coaching message found for that date." },
      { status: 404 }
    );
  }

  // Today but no message — return 202 (client should trigger generation and poll)
  return NextResponse.json(
    {
      status: "generating",
      message: "Your coaching message is being prepared. Check back in a few seconds.",
    },
    { status: 202 }
  );
}
