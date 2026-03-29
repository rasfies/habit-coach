import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

export async function GET(request: Request) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const perPage = Math.min(
    50,
    Math.max(1, parseInt(searchParams.get("per_page") ?? "20", 10))
  );
  const offset = (page - 1) * perPage;

  // Get total count
  const { count } = await supabase
    .from("ai_messages")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  const total = count ?? 0;
  const totalPages = Math.ceil(total / perPage);

  const { data: messages, error } = await supabase
    .from("ai_messages")
    .select("id, message_date, content, message_type, created_at")
    .eq("user_id", user.id)
    .order("message_date", { ascending: false })
    .range(offset, offset + perPage - 1);

  if (error) {
    console.error("Message history fetch error:", error);
    return NextResponse.json(
      { error: "FETCH_ERROR", message: "Failed to fetch message history." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    messages: messages ?? [],
    pagination: {
      page,
      per_page: perPage,
      total,
      total_pages: totalPages,
    },
  });
}
