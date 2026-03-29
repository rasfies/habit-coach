import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { RefreshSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = RefreshSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "VALIDATION_ERROR", message: "refresh_token is required." },
        { status: 422 }
      );
    }

    const supabase = await createServerClient();
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: parsed.data.refresh_token,
    });

    if (error || !data.session) {
      return NextResponse.json(
        {
          error: "INVALID_REFRESH_TOKEN",
          message: "Session expired. Please log in again.",
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: new Date(data.session.expires_at! * 1000).toISOString(),
    });
  } catch (err) {
    console.error("Refresh error:", err);
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
