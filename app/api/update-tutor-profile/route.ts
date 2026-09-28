import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { updateTutorProfile } from "@/app/tutoring/actions";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.id) {
      return NextResponse.json(
        { error: "You must be logged in" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const bio = formData.get("bio") as string;
    const subjects = formData.get("subjects") as string;
    const hourlyRate = formData.get("hourlyRate") ? parseInt(formData.get("hourlyRate") as string) : null;
    const timezone = formData.get("timezone") as string;

    await updateTutorProfile({
      bio,
      subjects: subjects ? subjects.split(",").map(s => s.trim()) : [],
      hourlyRate,
      timezone,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating tutor profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
