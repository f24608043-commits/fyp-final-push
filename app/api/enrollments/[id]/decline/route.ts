import { createClient } from "@/utils/supabase/server";
import { db } from "@/db";
import { tutorEnrollments, profiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

// POST /api/enrollments/:id/decline - Decline enrollment request (tutor only)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Verify user is a tutor
  const [profile] = await db
    .select({ role: profiles.role })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);

  if (!profile || profile.role !== "tutor") {
    return NextResponse.json({ error: "Only tutors can decline enrollment requests" }, { status: 403 });
  }

  // Get the enrollment
  const [enrollment] = await db
    .select()
    .from(tutorEnrollments)
    .where(eq(tutorEnrollments.id, id))
    .limit(1);

  if (!enrollment) {
    return NextResponse.json({ error: "Enrollment not found" }, { status: 404 });
  }

  // Verify this enrollment belongs to the tutor
  if (enrollment.tutorId !== user.id) {
    return NextResponse.json({ error: "You can only decline your own enrollment requests" }, { status: 403 });
  }

  // Update status to rejected
  const [updated] = await db
    .update(tutorEnrollments)
    .set({
      status: "rejected",
      updatedAt: new Date(),
    })
    .where(eq(tutorEnrollments.id, id))
    .returning();

  return NextResponse.json({ success: true, enrollment: updated });
}
