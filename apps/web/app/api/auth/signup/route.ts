import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { SignUpSchema } from "@/lib/validations";
import { z } from "zod";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = SignUpSchema.safeParse(body);

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

    const { email, password, display_name } = parsed.data;
    const supabase = await createServerClient();

    const { data: authData, error: authError } =
      await supabase.auth.signUp({ email, password });

    if (authError) {
      if (
        authError.message.toLowerCase().includes("already") ||
        authError.message.toLowerCase().includes("registered")
      ) {
        return NextResponse.json(
          {
            error: "EMAIL_ALREADY_IN_USE",
            message: "An account with this email already exists.",
          },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: "SIGNUP_ERROR", message: authError.message },
        { status: 500 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: "SIGNUP_ERROR", message: "Failed to create account." },
        { status: 500 }
      );
    }

    // Insert user profile row (RLS INSERT policy allows this during signup)
    const { error: profileError } = await supabase.from("users").insert({
      id: authData.user.id,
      email,
      display_name,
      onboarding_complete: false,
      notification_enabled: true,
    });

    if (profileError) {
      // Profile may already exist (race condition or OAuth flow)
      if (!profileError.code?.includes("23505")) {
        console.error("Profile insert error:", profileError);
      }
    }

    return NextResponse.json(
      {
        user: {
          id: authData.user.id,
          email: authData.user.email,
          display_name,
          onboarding_complete: false,
          created_at: authData.user.created_at,
        },
        session: authData.session
          ? {
              access_token: authData.session.access_token,
              refresh_token: authData.session.refresh_token,
              expires_at: new Date(
                authData.session.expires_at! * 1000
              ).toISOString(),
            }
          : null,
      },
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "VALIDATION_ERROR", message: err.message },
        { status: 422 }
      );
    }
    console.error("Signup error:", err);
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
