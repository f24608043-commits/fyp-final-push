import { createClient } from "@/utils/supabase/server";
import { db } from "@/db";
import {
  tutorEnrollments,
  profiles,
  tutorProfiles,
} from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { NextResponse } from "next/server";

// GET /api/enrollments - Returns enrollments for current user (learner or tutor)
export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const role = searchParams.get("role"); // "learner" or "tutor"

  // Get user's role from profile
  const [profile] = await db
    .select({ role: profiles.role })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const userRole = role || profile.role || "learner"; // Default to learner if role not set

  if (userRole === "learner") {
    // Return learner's enrollments with tutor info
    const enrollments = await db
      .select({
        id: tutorEnrollments.id,
        status: tutorEnrollments.status,
        message: tutorEnrollments.message,
        createdAt: tutorEnrollments.createdAt,
        tutorId: tutorEnrollments.tutorId,
        tutor: {
          id: profiles.id,
          displayName: profiles.displayName,
          avatarUrl: profiles.avatarUrl,
        },
        tutorProfile: {
          bio: tutorProfiles.bio,
          subjects: tutorProfiles.subjects,
          rating: tutorProfiles.rating,
          hourlyRate: tutorProfiles.hourlyRate,
        },
      })
      .from(tutorEnrollments)
      .innerJoin(profiles, eq(tutorEnrollments.tutorId, profiles.id))
      .leftJoin(tutorProfiles, eq(tutorEnrollments.tutorId, tutorProfiles.tutorId))
      .where(eq(tutorEnrollments.learnerId, user.id))
      .orderBy(desc(tutorEnrollments.createdAt));

    const pending = enrollments.filter((e) => e.status === "pending");
    const enrolled = enrollments.filter((e) => e.status === "accepted");
    const rejected = enrollments.filter((e) => e.status === "rejected");

    return NextResponse.json({ pending, enrolled, rejected });
  } else if (userRole === "tutor") {
    // Return tutor's enrollments with learner info
    const enrollments = await db
      .select({
        id: tutorEnrollments.id,
        status: tutorEnrollments.status,
        message: tutorEnrollments.message,
        createdAt: tutorEnrollments.createdAt,
        learnerId: tutorEnrollments.learnerId,
        learner: {
          id: profiles.id,
          displayName: profiles.displayName,
          avatarUrl: profiles.avatarUrl,
        },
      })
      .from(tutorEnrollments)
      .innerJoin(profiles, eq(tutorEnrollments.learnerId, profiles.id))
      .where(eq(tutorEnrollments.tutorId, user.id))
      .orderBy(desc(tutorEnrollments.createdAt));

    const requests = enrollments.filter((e) => e.status === "pending");
    const enrolled = enrollments.filter((e) => e.status === "accepted");
    const rejected = enrollments.filter((e) => e.status === "rejected");

    return NextResponse.json({ requests, enrolled, rejected });
  }

  return NextResponse.json({ error: "Invalid role" }, { status: 400 });
}

// POST /api/enrollments - Create enrollment request (learner only)
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { tutorId, message } = body;

  if (!tutorId) {
    return NextResponse.json({ error: "tutorId is required" }, { status: 400 });
  }

  // Verify user is a learner
  const [profile] = await db
    .select({ role: profiles.role })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);

  if (!profile || (profile.role && profile.role !== "learner")) {
    return NextResponse.json({ error: "Only learners can send enrollment requests" }, { status: 403 });
  }

  // Check if enrollment already exists
  const [existing] = await db
    .select()
    .from(tutorEnrollments)
    .where(
      and(
        eq(tutorEnrollments.learnerId, user.id),
        eq(tutorEnrollments.tutorId, tutorId)
      )
    )
    .limit(1);

  if (existing) {
    if (existing.status === "pending") {
      return NextResponse.json({ error: "Enrollment request already sent" }, { status: 400 });
    }
    if (existing.status === "accepted") {
      return NextResponse.json({ error: "Already enrolled with this tutor" }, { status: 400 });
    }
    if (existing.status === "rejected") {
      // Allow re-enrollment after rejection - update existing record
      await db
        .update(tutorEnrollments)
        .set({
          status: "pending",
          message: message || null,
          updatedAt: new Date(),
        })
        .where(eq(tutorEnrollments.id, existing.id));

      return NextResponse.json({ success: true, enrollment: { ...existing, status: "pending" } });
    }
  }

  // Create new enrollment request
  const [newEnrollment] = await db
    .insert(tutorEnrollments)
    .values({
      learnerId: user.id,
      tutorId,
      status: "pending",
      message: message || null,
    })
    .returning();

  return NextResponse.json({ success: true, enrollment: newEnrollment });
}
