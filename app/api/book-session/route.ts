import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { requestSession, getTutorAvailability } from "@/app/tutoring/actions";
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

    let tutorId = "";
    let date = "";
    let slotIndex = -1;
    let startTime = "";
    let endTime = "";
    let message = "";

    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const json = await request.json();
      tutorId = json.tutorId;
      date = json.date;
      slotIndex = json.slotIndex ?? -1;
      startTime = json.startTime || "";
      endTime = json.endTime || "";
      message = json.message || "";
    } else {
      const formData = await request.formData();
      tutorId = formData.get("tutorId") as string;
      date = formData.get("date") as string;
      const rawSlot = formData.get("slotIndex") as string;
      slotIndex = rawSlot !== null && rawSlot !== undefined ? parseInt(rawSlot, 10) : -1;
      startTime = (formData.get("startTime") as string) || "";
      endTime = (formData.get("endTime") as string) || "";
      message = formData.get("message") as string;
    }

    if (!tutorId || !date || !message) {
      return NextResponse.json(
        { error: "Missing required fields: tutorId, date, and message" },
        { status: 400 }
      );
    }

    // Retrieve availability
    const availability = await getTutorAvailability(tutorId);

    let selectedStartTime = startTime;
    let selectedEndTime = endTime;

    if ((!selectedStartTime || !selectedEndTime) && !isNaN(slotIndex) && slotIndex >= 0 && slotIndex < availability.length) {
      const slot = availability[slotIndex];
      selectedStartTime = slot.startTime;
      selectedEndTime = slot.endTime;
    } else if (!selectedStartTime || !selectedEndTime) {
      if (availability.length > 0) {
        selectedStartTime = availability[0].startTime;
        selectedEndTime = availability[0].endTime;
      }
    }

    if (!selectedStartTime || !selectedEndTime) {
      return NextResponse.json(
        { error: "Invalid time slot selected" },
        { status: 400 }
      );
    }

    // The date chosen by the user is the intended date
    const formattedDate = date.trim();

    // Create session request with conflict checking
    const result = await requestSession({
      tutorId,
      requestedSlots: [
        {
          date: formattedDate,
          startTime: selectedStartTime,
          endTime: selectedEndTime,
        },
      ],
      message,
    });

    if (contentType.includes("application/json")) {
      return NextResponse.json({ success: true, requestId: result.requestId });
    }

    return NextResponse.redirect(new URL("/tutoring?booked=true", request.url));
  } catch (error: any) {
    console.error("Book session error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to book session" },
      { status: 500 }
    );
  }
}
