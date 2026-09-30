import { createClient } from "@/utils/supabase/server";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return NextResponse.redirect(new URL("/sign-in?error=Email and password are required", request.url));
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return NextResponse.redirect(new URL(`/sign-in?error=${encodeURIComponent(error.message)}`, request.url));
  }

  // Get user profile to determine redirect based on role
  if (data.user) {
    let profile = null;
    try {
      const [profileResult] = await db
        .select()
        .from(profiles)
        .where(eq(profiles.id, data.user.id))
        .limit(1);
      profile = profileResult;
    } catch (error) {
      console.error('Error fetching profile during login:', error);
      return NextResponse.redirect(new URL("/path", request.url));
    }

    if (profile) {
      // Redirect based on role
      if (profile.role === "admin") {
        return NextResponse.redirect(new URL("/admin", request.url));
      } else if (profile.role === "tutor") {
        return NextResponse.redirect(new URL("/tutoring/dashboard", request.url));
      } else if (profile.role === "learner") {
        // Learners go to onboarding if not done, otherwise path
        if (profile.onboardingDone) {
          return NextResponse.redirect(new URL("/path", request.url));
        } else {
          return NextResponse.redirect(new URL("/onboarding", request.url));
        }
      }
    }
  }

  // Default fallback
  return NextResponse.redirect(new URL("/path", request.url));
}
