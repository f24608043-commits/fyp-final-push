import { createClient } from "@/utils/supabase/server";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const displayName = formData.get("displayName") as string;

  if (!email || !password) {
    return NextResponse.redirect(new URL("/sign-up?error=Email and password are required", request.url));
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName || email.split("@")[0],
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:4005"}/auth/callback`,
    },
  });

  if (error) {
    console.error("Sign-up error:", error);
    // If user already registered, redirect to sign-in
    if (error.message.includes("already registered") || error.message.includes("already been registered")) {
      return NextResponse.redirect(new URL("/sign-in?info=Account already exists. Please sign in.", request.url));
    }
    return NextResponse.redirect(new URL(`/sign-up?error=${encodeURIComponent(error.message)}`, request.url));
  }

  // Fallback: Manually create profile if trigger didn't work
  if (data.user) {
    try {
      const [existingProfile] = await db
        .select()
        .from(profiles)
        .where(eq(profiles.id, data.user!.id))
        .limit(1);

      if (!existingProfile) {
        await db.insert(profiles).values({
          id: data.user.id,
          displayName: displayName || email.split("@")[0],
          role: "learner",
          xp: 0,
          streakCount: 0,
          onboardingDone: false,
        });
      }
    } catch (dbError) {
      console.error("Profile creation error:", dbError);
      // Continue anyway - the trigger might have worked
    }
  }

  // If email confirmation is required, don't auto sign in
  if (!data.session) {
    return NextResponse.redirect(new URL("/sign-in?error=Please check your email to confirm your account", request.url));
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    return NextResponse.redirect(new URL(`/sign-in?error=${encodeURIComponent(signInError.message)}`, request.url));
  }

  return NextResponse.redirect(new URL("/onboarding", request.url));
}
