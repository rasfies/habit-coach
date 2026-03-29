import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { ReorderHabitsSchema } from "@/lib/validations";

export async function POST(request: Request) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = ReorderHabitsSchema.safeParse(body);

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

  const { order } = parsed.data;
  const ids = order.map((o) => o.id);

  // Verify all habit IDs belong to the authenticated user
  const { data: userHabits, error: fetchError } = await supabase
    .from("habits")
    .select("id")
    .eq("user_id", user.id)
    .in("id", ids);

  if (fetchError) {
    return NextResponse.json(
      { error: "FETCH_ERROR", message: "Failed to validate habit ownership." },
      { status: 500 }
    );
  }

  const ownedIds = new Set((userHabits ?? []).map((h) => h.id));
  const allOwned = ids.every((id) => ownedIds.has(id));

  if (!allOwned) {
    return NextResponse.json(
      {
        error: "VALIDATION_ERROR",
        message: "All habit IDs must belong to the authenticated user.",
      },
      { status: 422 }
    );
  }

  // Batch update sort_order
  const updates = order.map((o) =>
    supabase
      .from("habits")
      .update({ sort_order: o.sort_order })
      .eq("id", o.id)
      .eq("user_id", user.id)
  );

  const results = await Promise.all(updates);
  const hasError = results.some((r) => r.error);

  if (hasError) {
    return NextResponse.json(
      { error: "UPDATE_ERROR", message: "Failed to reorder habits." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
