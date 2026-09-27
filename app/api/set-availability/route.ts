import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { setAvailability } from "@/app/tutoring/actions";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user?.id) {
      return NextResponse.json(
        { error: "You must be logged in" },
        { status: 401 }
      );
    }

    // Parse availability slots from form data
    const slots: { dayOfWeek: number; startTime: string; endTime: string }[] = [];
    
    for (let day = 0; day < 7; day++) {
      const enabled = formData.get(`day_${day}_enabled`) === "on";
      
      if (enabled) {
        let slotIndex = 0;
        while (true) {
          const startTime = formData.get(`day_${day}_slot_${slotIndex}_start`) as string;
          const endTime = formData.get(`day_${day}_slot_${slotIndex}_end`) as string;
          
          if (!startTime || !endTime) break;
          
          slots.push({
            dayOfWeek: day,
            startTime,
            endTime,
          });
          
          slotIndex++;
        }
      }
    }

    // Set availability
    await setAvailability(slots);

    return NextResponse.redirect(new URL("/tutoring/dashboard", request.url));
  } catch (error) {
    console.error("Set availability error:", error);
    return NextResponse.json(
      { error: "Failed to set availability" },
      { status: 500 }
    );
  }
}
