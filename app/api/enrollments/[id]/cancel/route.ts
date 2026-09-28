import { createClient } from "@/utils/supabase/server";
import { db } from "@/db";
import { tutorEnrollments, profiles } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";

// POST /api/enrollments/:id/cancel - Cancel enrollment request (learner only)
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

  // Verify user is a learner
  const [profile] = await db
    .select({ role: profiles.role })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);

  if (!profile || profile.role !== "learner") {
    return NextResponse.json({ error: "Only learners can cancel enrollment requests" }, { status: 403 });
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

  // Verify this enrollment belongs to the learner
  if (enrollment.learnerId !== user.id) {
    return NextResponse.json({ error: "You can only cancel your own enrollment requests" }, { status: 403 });
  }

  // Only allow canceling pending requests
  if (enrollment.status !== "pending") {
    return NextResponse.json({ error: "Can only cancel pending enrollment requests" }, { status: 400 });
  }

  // Update status to rejected (cancelled)
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
