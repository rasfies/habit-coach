import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { OAuthSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = OAuthSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "VALIDATION_ERROR", message: "redirect_url is required and must be a valid URL." },
        { status: 422 }
      );
    }

    const supabase = await createServerClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: parsed.data.redirect_url,
      },
    });

    if (error) {
      return NextResponse.json(
        { error: "OAUTH_ERROR", message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: data.url });
  } catch (err) {
    console.error("OAuth error:", err);
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
