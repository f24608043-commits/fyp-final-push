import { createClient } from "@/utils/supabase/server";
import { db } from "@/db";
import {
  tutorGroupSessions,
  tutorGroups,
  profiles,
} from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

// GET /api/groups/:id/sessions - Returns sessions for a group
export async function GET(
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

  // Get the group to verify access
  const [group] = await db
    .select({ tutorId: tutorGroups.tutorId })
    .from(tutorGroups)
    .where(eq(tutorGroups.id, id))
    .limit(1);

  if (!group) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }

  // Verify user is the tutor (for now, only tutors can view sessions)
  if (group.tutorId !== user.id) {
    return NextResponse.json({ error: "Only the tutor can view group sessions" }, { status: 403 });
  }

  // Get sessions
  const sessions = await db
    .select()
    .from(tutorGroupSessions)
    .where(eq(tutorGroupSessions.groupId, id))
    .orderBy(tutorGroupSessions.startTime);

  return NextResponse.json({ sessions });
}

// POST /api/groups/:id/sessions - Create a new group session (tutor only)
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
  const body = await request.json();
  const { startTime, endTime, notes } = body;

  if (!startTime) {
    return NextResponse.json({ error: "startTime is required" }, { status: 400 });
  }

  // Verify user is a tutor
  const [profile] = await db
    .select({ role: profiles.role })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);

  if (!profile || profile.role !== "tutor") {
    return NextResponse.json({ error: "Only tutors can create group sessions" }, { status: 403 });
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
    return NextResponse.json({ error: "You can only create sessions for your own groups" }, { status: 403 });
  }

  // Generate Jitsi room ID
  const jitsiRoomId = `group-${id}-${Date.now()}`;
  const meetingUrl = `https://meet.jit.si/${jitsiRoomId}`;

  // Create session
  const [newSession] = await db
    .insert(tutorGroupSessions)
    .values({
      groupId: id,
      meetingUrl,
      startTime: new Date(startTime),
      endTime: endTime ? new Date(endTime) : null,
      jitsiRoomId,
      notes: notes || null,
      status: "scheduled",
    })
    .returning();

  return NextResponse.json({ success: true, session: newSession });
}
