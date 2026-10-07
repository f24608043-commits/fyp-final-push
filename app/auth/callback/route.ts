import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// Handles the OAuth / email-confirmation callback from Supabase Auth.
// Exchanges the auth `code` for a session cookie, then routes the user
// based on their role (defaults to the learner onboarding/path flow).
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/onboarding";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocalEnv = process.env.NODE_ENV === "development";
      if (isLocalEnv && forwardedHost) {
        return NextResponse.redirect(`http://${forwardedHost}${next}`);
      }
      return NextResponse.redirect(`${origin}${next}`);
    }

    console.error("[AUTH CALLBACK] Code exchange error:", error.message);
    return NextResponse.redirect(`${origin}/sign-in?error=${encodeURIComponent(error.message)}`);
  }

  // No code present — leave the token in hashed state so Supabase can validate it
  return NextResponse.redirect(`${origin}/sign-in?error=missing_code`);
}