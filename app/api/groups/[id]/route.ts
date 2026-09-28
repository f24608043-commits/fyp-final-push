import { createClient } from "@/utils/supabase/server";
import { db } from "@/db";
import {
  tutorGroups,
  tutorGroupMembers,
  profiles,
  tutorEnrollments,
} from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";

// PUT /api/groups/:id - Update a group (tutor only)
export async function PUT(
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
  const body = await request.json();
  const { name, description, learnerIds } = body;

  // Verify user is a tutor
  const [profile] = await db
    .select({ role: profiles.role })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);

  if (!profile || profile.role !== "tutor") {
    return NextResponse.json({ error: "Only tutors can update groups" }, { status: 403 });
  }

  // Get the group
  const [group] = await db
    .select()
    .from(tutorGroups)
    .where(eq(tutorGroups.id, id))
    .limit(1);

  if (!group) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }

  // Verify this group belongs to the tutor
  if (group.tutorId !== user.id) {
    return NextResponse.json({ error: "You can only update your own groups" }, { status: 403 });
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

  // Update group
  const [updatedGroup] = await db
    .update(tutorGroups)
    .set({
      name: name || group.name,
      description: description !== undefined ? description : group.description,
      updatedAt: new Date(),
    })
    .where(eq(tutorGroups.id, id))
    .returning();

  // Update members if learnerIds provided
  if (learnerIds !== undefined) {
    // Delete existing members
    await db.delete(tutorGroupMembers).where(eq(tutorGroupMembers.groupId, id));

    // Add new members
    if (learnerIds.length > 0) {
      const members = learnerIds.map((learnerId: string) => ({
        groupId: id,
        learnerId,
      }));
      await db.insert(tutorGroupMembers).values(members);
    }
  }

  return NextResponse.json({ success: true, group: updatedGroup });
}

// DELETE /api/groups/:id - Delete a group (tutor only)
export async function DELETE(
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
    return NextResponse.json({ error: "Only tutors can delete groups" }, { status: 403 });
  }

  // Get the group
  const [group] = await db
    .select()
    .from(tutorGroups)
    .where(eq(tutorGroups.id, id))
    .limit(1);

  if (!group) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }

  // Verify this group belongs to the tutor
  if (group.tutorId !== user.id) {
    return NextResponse.json({ error: "You can only delete your own groups" }, { status: 403 });
  }

  // Delete group (cascade will delete members and sessions)
  await db.delete(tutorGroups).where(eq(tutorGroups.id, id));

  return NextResponse.json({ success: true });
}
