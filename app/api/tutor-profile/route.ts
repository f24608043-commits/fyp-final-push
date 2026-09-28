import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getTutorProfile } from "@/app/tutoring/actions";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tutorId = searchParams.get("tutorId");

    if (!tutorId) {
      return NextResponse.json(
        { error: "Missing tutorId parameter" },
        { status: 400 }
      );
    }

    const profile = await getTutorProfile(tutorId);

    return NextResponse.json({ profile });
  } catch (error) {
    console.error("Error fetching tutor profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile", profile: null },
      { status: 500 }
    );
  }
}
