import { createClient } from "@/utils/supabase/server";
import { db } from "@/db";
import {
  tutorGroups,
  tutorGroupMembers,
  profiles,
  tutorEnrollments,
} from "@/db/schema";
import { eq, and, inArray, sql, desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";

// GET /api/groups - Returns tutor's groups with member counts
export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify user is a tutor
  const [profile] = await db
    .select({ role: profiles.role })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);

  if (!profile || profile.role !== "tutor") {
    return NextResponse.json({ error: "Only tutors can view groups" }, { status: 403 });
  }

  // Get groups with member counts
  const groups = await db
    .select({
      id: tutorGroups.id,
      name: tutorGroups.name,
      description: tutorGroups.description,
      isActive: tutorGroups.isActive,
      createdAt: tutorGroups.createdAt,
      updatedAt: tutorGroups.updatedAt,
    })
    .from(tutorGroups)
    .where(eq(tutorGroups.tutorId, user.id))
    .orderBy(desc(tutorGroups.createdAt));

  // Get member counts for each group
  const groupIds = groups.map((g) => g.id);
  const memberCounts = await db
    .select({
      groupId: tutorGroupMembers.groupId,
      count: tutorGroupMembers.learnerId,
    })
    .from(tutorGroupMembers)
    .where(inArray(tutorGroupMembers.groupId, groupIds));

  const groupsWithCounts = groups.map((group) => ({
    ...group,
    memberCount: memberCounts.filter((m) => m.groupId === group.id).length,
  }));

  return NextResponse.json({ groups: groupsWithCounts });
}

// POST /api/groups - Create a new group (tutor only)
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit: 20 requests per minute per user
  const rateLimitResult = rateLimit(user.id, 20, 60000);
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Please try again later." },
      { status: 429 }
    );
  }

  const body = await request.json();
  const { name, description, learnerIds } = body;

  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  // Verify user is a tutor
  const [profile] = await db
    .select({ role: profiles.role })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);

  if (!profile || profile.role !== "tutor") {
    return NextResponse.json({ error: "Only tutors can create groups" }, { status: 403 });
  }

  // Verify all learners are enrolled with this tutor
  if (learnerIds && learnerIds.length > 0) {
    const enrollments = await db
      .select({ learnerId: tutorEnrollments.learnerId })
      .from(tutorEnrollments)
      .where(
        and(
          eq(tutorEnrollments.tutorId, user.id),
          eq(tutorEnrollments.status, "accepted"),
          inArray(tutorEnrollments.learnerId, learnerIds)
        )
      );

    const enrolledLearnerIds = enrollments.map((e) => e.learnerId);
    const notEnrolled = learnerIds.filter((id: string) => !enrolledLearnerIds.includes(id));

    if (notEnrolled.length > 0) {
      return NextResponse.json(
        { error: "Some learners are not enrolled with this tutor", notEnrolled },
        { status: 400 }
      );
    }
  }

  // Create group
  const [newGroup] = await db
    .insert(tutorGroups)
    .values({
      tutorId: user.id,
      name,
      description: description || null,
    })
    .returning();

  // Add members if provided
  if (learnerIds && learnerIds.length > 0) {
    const members = learnerIds.map((learnerId: string) => ({
      groupId: newGroup.id,
      learnerId,
    }));
    await db.insert(tutorGroupMembers).values(members);
  }

  return NextResponse.json({ success: true, group: newGroup });
}
