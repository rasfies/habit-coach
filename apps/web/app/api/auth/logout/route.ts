import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

export async function POST() {
  try {
    const supabase = await createServerClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      return NextResponse.json(
        { error: "LOGOUT_ERROR", message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Logout error:", err);
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
