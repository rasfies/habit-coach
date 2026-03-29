import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { LoginSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = LoginSchema.safeParse(body);

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

    const { email, password } = parsed.data;
    const supabase = await createServerClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return NextResponse.json(
        {
          error: "INVALID_CREDENTIALS",
          message: "Email or password is incorrect.",
        },
        { status: 401 }
      );
    }

    if (!data.user || !data.session) {
      return NextResponse.json(
        { error: "LOGIN_ERROR", message: "Failed to sign in." },
        { status: 500 }
      );
    }

    // Fetch user profile
    const { data: profile } = await supabase
      .from("users")
      .select(
        "display_name, avatar_url, onboarding_complete"
      )
      .eq("id", data.user.id)
      .single();

    return NextResponse.json({
      user: {
        id: data.user.id,
        email: data.user.email,
        display_name: profile?.display_name ?? "",
        avatar_url: profile?.avatar_url ?? null,
        onboarding_complete: profile?.onboarding_complete ?? false,
      },
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: new Date(data.session.expires_at! * 1000).toISOString(),
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
