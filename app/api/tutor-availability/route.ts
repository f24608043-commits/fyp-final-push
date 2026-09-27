import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getTutorAvailability } from "@/app/tutoring/actions";

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

    const availability = await getTutorAvailability(tutorId);

    return NextResponse.json({ availability });
  } catch (error) {
    console.error("Error fetching tutor availability:", error);
    return NextResponse.json(
      { error: "Failed to fetch availability", availability: [] },
      { status: 500 }
    );
  }
}
