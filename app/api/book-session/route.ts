import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { requestSession } from "@/app/tutoring/actions";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Rate limit: 10 requests per minute per user
    const rateLimitResult = rateLimit(user.id, 10, 60000);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again later." },
        { status: 429 }
      );
    }
    const formData = await request.formData();
    const tutorId = formData.get("tutorId") as string;
    const date = formData.get("date") as string;
    const slotIndex = parseInt(formData.get("slotIndex") as string);
    const message = formData.get("message") as string;

    if (!tutorId || !date || isNaN(slotIndex) || !message) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get tutor availability to find the selected slot
    const { getTutorAvailability } = await import("@/app/tutoring/actions");
    const availability = await getTutorAvailability(tutorId);
    const selectedSlot = availability[slotIndex];

    if (!selectedSlot) {
      return NextResponse.json(
        { error: "Invalid time slot" },
        { status: 400 }
      );
    }

    // Calculate the actual scheduled date based on the selected day of week
    const selectedDate = new Date(date);
    const selectedDayOfWeek = selectedDate.getDay();

    // Find the next occurrence of the selected day of week
    const daysUntilSlot = (selectedSlot.dayOfWeek - selectedDayOfWeek + 7) % 7;
    const actualDate = new Date(selectedDate);
    actualDate.setDate(actualDate.getDate() + daysUntilSlot);

    // Format the date for the session request
    const formattedDate = actualDate.toISOString().split('T')[0];

    // Create session request with proper date
    await requestSession({
      tutorId,
      requestedSlots: [
        {
          date: formattedDate,
          startTime: selectedSlot.startTime,
          endTime: selectedSlot.endTime,
        },
      ],
      message,
    });

    return NextResponse.redirect(new URL("/tutoring", request.url));
  } catch (error) {
    console.error("Book session error:", error);
    return NextResponse.json(
      { error: "Failed to book session" },
      { status: 500 }
    );
  }
}
