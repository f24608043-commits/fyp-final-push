import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { db } from "@/db";
import { enrollments } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const courseId = formData.get("courseId") as string;

  if (!courseId) {
    return NextResponse.json({ error: "Course ID required" }, { status: 400 });
  }

  try {
    // Check for existing enrollment
    const [existingEnrollment] = await db
      .select()
      .from(enrollments)
      .where(
        and(
          eq(enrollments.userId, user.id),
          eq(enrollments.courseId, courseId)
        )
      )
      .limit(1);

    if (existingEnrollment) {
      // Activate existing enrollment
      await db
        .update(enrollments)
        .set({ isActive: true })
        .where(eq(enrollments.id, existingEnrollment.id));
    } else {
      // Create new enrollment
      await db.insert(enrollments).values({
        userId: user.id,
        courseId,
        isActive: true,
        placementAnswer: "beginner",
      });
    }

    revalidatePath("/path");
    revalidatePath("/library");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Enrollment error:", error);
    return NextResponse.json({ error: "Failed to enroll" }, { status: 500 });
  }
}
