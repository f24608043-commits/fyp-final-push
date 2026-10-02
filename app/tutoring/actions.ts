"use server";

import { db } from "@/db";
import { tutorProfiles, tutorAvailability, tutorSessions, sessionRequests, sessionNotes, profiles, tutorEnrollments, learnerStats, tasks, taskSubmissions, badges, userBadges } from "@/db/schema";
import { eq, and, or, desc, inArray, gte, lte } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { createNotification } from "@/app/notifications/actions";

// Tutor Profile Actions
export async function createTutorProfile(data: {
  bio: string;
  subjects: string[];
  hourlyRate: number | null;
  timezone: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user?.id) {
    throw new Error("You must be logged in");
  }

  // Check if profile already exists
  const [existing] = await db
    .select()
    .from(tutorProfiles)
    .where(eq(tutorProfiles.tutorId, user.id))
    .limit(1);

  if (existing) {
    throw new Error("Tutor profile already exists");
  }

  await db.insert(tutorProfiles).values({
    tutorId: user.id,
    bio: data.bio,
    subjects: data.subjects,
    hourlyRate: data.hourlyRate,
    timezone: data.timezone,
  });

  revalidatePath("/tutoring");
  return { success: true };
}

export async function updateTutorProfile(data: {
  tutorId?: string;
  bio?: string;
  subjects?: string[];
  hourlyRate?: number | null;
  timezone?: string;
  isActive?: boolean;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user?.id) {
    throw new Error("You must be logged in");
  }

  const targetTutorId = data.tutorId || user.id;

  // Check if user is admin
  let isAdmin = false;
  try {
    const [adminProfile] = await db
      .select({ role: profiles.role })
      .from(profiles)
      .where(eq(profiles.id, user.id))
      .limit(1);
    isAdmin = adminProfile?.role === "admin";
  } catch (error) {
    console.error('Error checking admin status:', error);
  }

  // Only tutor themselves or admin can update profile
  if (targetTutorId !== user.id && !isAdmin) {
    throw new Error("You can only update your own profile");
  }

  await db
    .update(tutorProfiles)
    .set({
      bio: data.bio,
      subjects: data.subjects,
      hourlyRate: data.hourlyRate,
      timezone: data.timezone,
      isActive: data.isActive,
      updatedAt: new Date(),
    })
    .where(eq(tutorProfiles.tutorId, targetTutorId));

  revalidatePath("/tutoring");
  revalidatePath("/admin/tutoring");
  return { success: true };
}

export async function getTutorProfile(tutorId: string) {
  const [profile] = await db
    .select({
      tutorId: tutorProfiles.tutorId,
      bio: tutorProfiles.bio,
      subjects: tutorProfiles.subjects,
      hourlyRate: tutorProfiles.hourlyRate,
      timezone: tutorProfiles.timezone,
      isActive: tutorProfiles.isActive,
      rating: tutorProfiles.rating,
      totalSessions: tutorProfiles.totalSessions,
      createdAt: tutorProfiles.createdAt,
      updatedAt: tutorProfiles.updatedAt,
      displayName: profiles.displayName,
      avatarUrl: profiles.avatarUrl,
    })
    .from(tutorProfiles)
    .innerJoin(profiles, eq(tutorProfiles.tutorId, profiles.id))
    .where(eq(tutorProfiles.tutorId, tutorId))
    .limit(1);

  return profile;
}

// Tutor Availability Actions
export async function setAvailability(slots: {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}[]) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user?.id) {
    throw new Error("You must be logged in");
  }

  try {
    // Check if user has a tutor profile
    const [tutorProfile] = await db
      .select()
      .from(tutorProfiles)
      .where(eq(tutorProfiles.tutorId, user.id))
      .limit(1);

    if (!tutorProfile) {
      throw new Error("You must create a tutor profile first");
    }

    // Delete existing availability
    await db
      .delete(tutorAvailability)
      .where(eq(tutorAvailability.tutorId, user.id));

    // Insert new availability slots
    if (slots.length > 0) {
      await db.insert(tutorAvailability).values(
        slots.map(slot => ({
          tutorId: user.id,
          dayOfWeek: slot.dayOfWeek,
          startTime: slot.startTime,
          endTime: slot.endTime,
        }))
      );
    }

    revalidatePath("/tutoring");
    revalidatePath("/tutoring/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Error setting availability:", error);
    throw error;
  }
}

export async function getTutorAvailability(tutorId: string) {
  try {
    const availability = await db
      .select()
      .from(tutorAvailability)
      .where(and(eq(tutorAvailability.tutorId, tutorId), eq(tutorAvailability.isActive, true)))
      .orderBy(tutorAvailability.dayOfWeek)
      .limit(50);

    return availability;
  } catch (error) {
    console.error('Error fetching tutor availability:', error);
    return []; // Return empty array on timeout/error
  }
}

// Session Booking Actions
export async function requestSession(data: {
  tutorId: string;
  courseId?: string;
  requestedSlots: Array<{ date: string; startTime: string; endTime: string }>;
  message?: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user?.id) {
    throw new Error("You must be logged in");
  }

  // Check for double-booking
  for (const slot of data.requestedSlots) {
    const [existing] = await db
      .select()
      .from(tutorSessions)
      .where(
        and(
          eq(tutorSessions.tutorId, data.tutorId),
          eq(tutorSessions.status, "confirmed"),
          gte(tutorSessions.scheduledAt, new Date(slot.date + "T" + slot.startTime)),
          lte(tutorSessions.scheduledAt, new Date(slot.date + "T" + slot.endTime))
        )
      )
      .limit(1);

    if (existing) {
      throw new Error("This time slot is already booked");
    }
  }

  // Create session request
  const [request] = await db
    .insert(sessionRequests)
    .values({
      learnerId: user.id,
      tutorId: data.tutorId,
      requestedSlots: data.requestedSlots,
      message: data.message,
    })
    .returning();

  // Notify tutor
  await createNotification({
    userId: data.tutorId,
    type: "lesson_completed", // Reusing existing type for now
    title: "New Session Request",
    message: "You have a new tutoring session request",
    data: { requestId: request.id },
  });

  revalidatePath("/tutoring");
  return { success: true, requestId: request.id };
}

export async function acceptSessionRequest(requestId: string, selectedSlotIndex: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user?.id) {
    throw new Error("You must be logged in");
  }

  try {
    // Get the request
    const [request] = await db
      .select()
      .from(sessionRequests)
      .where(eq(sessionRequests.id, requestId))
      .limit(1);

    if (!request || request.tutorId !== user.id) {
      throw new Error("Request not found or unauthorized");
    }

    const selectedSlot = (request.requestedSlots as any)[selectedSlotIndex];
    if (!selectedSlot) {
      throw new Error("Invalid slot selection");
    }

    // Generate Jitsi room ID
    const jitsiRoomId = `${requestId}-${Math.random().toString(36).substring(2, 10)}`;

    // Create confirmed session
    const [session] = await db
      .insert(tutorSessions)
      .values({
        learnerId: request.learnerId,
        tutorId: request.tutorId,
        courseId: null, // Will be set from request if needed
        scheduledAt: new Date(selectedSlot.date + "T" + selectedSlot.startTime),
        durationMins: 60, // Calculate from slot times
        status: "confirmed",
        jitsiRoomId,
      })
      .returning();

    // Update request status
    await db
      .update(sessionRequests)
      .set({ status: "accepted", updatedAt: new Date() })
      .where(eq(sessionRequests.id, requestId));

    // Notify learner
    await createNotification({
      userId: request.learnerId,
      type: "lesson_completed",
      title: "Session Request Accepted",
      message: "Your tutoring session has been confirmed",
      data: { sessionId: session.id },
    });

    revalidatePath("/tutoring");
    revalidatePath("/tutoring/dashboard");
    return { success: true, sessionId: session.id };
  } catch (error) {
    console.error("Error accepting session request:", error);
    throw new Error("Failed to accept session request. Please try again.");
  }
}

export async function declineSessionRequest(requestId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user?.id) {
    throw new Error("You must be logged in");
  }

  // Get the request
  const [request] = await db
    .select()
    .from(sessionRequests)
    .where(eq(sessionRequests.id, requestId))
    .limit(1);

  if (!request || request.tutorId !== user.id) {
    throw new Error("Request not found or unauthorized");
  }

  // Update request status
  await db
    .update(sessionRequests)
    .set({ status: "declined", updatedAt: new Date() })
    .where(eq(sessionRequests.id, requestId));

  // Notify learner
  await createNotification({
    userId: request.learnerId,
    type: "lesson_completed",
    title: "Session Request Declined",
    message: "Your tutoring session request was declined",
    data: { requestId },
  });

  revalidatePath("/tutoring");
  return { success: true };
}

// Session Management Actions
export async function getSession(sessionId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user?.id) {
    throw new Error("You must be logged in");
  }

  const [session] = await db
    .select()
    .from(tutorSessions)
    .where(eq(tutorSessions.id, sessionId))
    .limit(1);

  if (!session) {
    throw new Error("Session not found");
  }

  // Check access control
  if (session.tutorId !== user.id && session.learnerId !== user.id) {
    throw new Error("Unauthorized access to session");
  }

  return session;
}

export async function updateSessionStatus(sessionId: string, status: "confirmed" | "cancelled" | "completed" | "no_show") {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user?.id) {
    throw new Error("You must be logged in");
  }

  const [session] = await db
    .select()
    .from(tutorSessions)
    .where(eq(tutorSessions.id, sessionId))
    .limit(1);

  if (!session) {
    throw new Error("Session not found");
  }

  // Check if user is admin
  let isAdmin = false;
  try {
    const [adminProfile] = await db
      .select({ role: profiles.role })
      .from(profiles)
      .where(eq(profiles.id, user.id))
      .limit(1);
    isAdmin = adminProfile?.role === "admin";
  } catch (error) {
    console.error('Error checking admin status:', error);
  }

  // Only tutor or admin can update status
  if (session.tutorId !== user.id && !isAdmin) {
    throw new Error("Only tutor or admin can update session status");
  }

  await db
    .update(tutorSessions)
    .set({ status, updatedAt: new Date() })
    .where(eq(tutorSessions.id, sessionId));

  revalidatePath("/tutoring");
  revalidatePath("/admin/tutoring");
  return { success: true };
}

// Session Notes Actions
export async function addSessionNote(data: {
  sessionId: string;
  noteText: string;
  visibility: "private_tutor" | "shared";
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user?.id) {
    throw new Error("You must be logged in");
  }

  const [session] = await db
    .select()
    .from(tutorSessions)
    .where(eq(tutorSessions.id, data.sessionId))
    .limit(1);

  if (!session) {
    throw new Error("Session not found");
  }

  // Only tutor can add notes
  if (session.tutorId !== user.id) {
    throw new Error("Only tutor can add session notes");
  }

  await db.insert(sessionNotes).values({
    sessionId: data.sessionId,
    authorId: user.id,
    noteText: data.noteText,
    visibility: data.visibility,
  });

  revalidatePath("/tutoring");
  return { success: true };
}

export async function getSessionNotes(sessionId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user?.id) {
    throw new Error("You must be logged in");
  }

  const [session] = await db
    .select()
    .from(tutorSessions)
    .where(eq(tutorSessions.id, sessionId))
    .limit(1);

  if (!session) {
    throw new Error("Session not found");
  }

  // Check access control
  if (session.tutorId !== user.id && session.learnerId !== user.id) {
    throw new Error("Unauthorized access to session");
  }

  const notes = await db
    .select()
    .from(sessionNotes)
    .where(eq(sessionNotes.sessionId, sessionId));

  // Filter private notes for learners
  if (session.learnerId === user.id) {
    return notes.filter(note => note.visibility === "shared");
  }

  return notes;
}

// Tutor Directory Actions
export async function getTutors(filters?: {
  subject?: string;
  minRating?: number;
}) {
  const tutors = await db
    .select({
      id: tutorProfiles.id,
      tutorId: tutorProfiles.tutorId,
      bio: tutorProfiles.bio,
      subjects: tutorProfiles.subjects,
      hourlyRate: tutorProfiles.hourlyRate,
      timezone: tutorProfiles.timezone,
      rating: tutorProfiles.rating,
      totalSessions: tutorProfiles.totalSessions,
      displayName: profiles.displayName,
      avatarUrl: profiles.avatarUrl,
    })
    .from(tutorProfiles)
    .innerJoin(profiles, eq(tutorProfiles.tutorId, profiles.id))
    .where(eq(tutorProfiles.isActive, true))
    .orderBy(desc(tutorProfiles.rating));

  // Filter by subject if provided (client-side filter for simplicity)
  if (filters?.subject) {
    return tutors.filter((tutor) =>
      tutor.subjects?.includes(filters.subject!)
    );
  }

  // Filter by minimum rating if provided
  if (filters?.minRating) {
    return tutors.filter((tutor) =>
      (tutor.rating || 0) >= filters.minRating!
    );
  }

  return tutors;
}

export async function getMySessions() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user?.id) {
    return [];
  }

  try {
    const sessions = await db
      .select()
      .from(tutorSessions)
      .where(or(eq(tutorSessions.tutorId, user.id), eq(tutorSessions.learnerId, user.id)))
      .orderBy(desc(tutorSessions.scheduledAt))
      .limit(50);

    return sessions;
  } catch (error) {
    console.error('Error fetching my sessions:', error);
    return [];
  }
}

export async function getPendingRequests() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user?.id) {
    return [];
  }

  const requests = await db
    .select({
      id: sessionRequests.id,
      requestedSlots: sessionRequests.requestedSlots,
      message: sessionRequests.message,
      status: sessionRequests.status,
      createdAt: sessionRequests.createdAt,
      learner: {
        id: profiles.id,
        displayName: profiles.displayName,
        avatarUrl: profiles.avatarUrl,
      },
    })
    .from(sessionRequests)
    .innerJoin(profiles, eq(sessionRequests.learnerId, profiles.id))
    .where(and(eq(sessionRequests.tutorId, user.id), eq(sessionRequests.status, "pending")))
    .orderBy(desc(sessionRequests.createdAt))
    .limit(50);

  return requests;
}

// Tutor Enrollment Actions
export async function requestTutorEnrollment(data: {
  tutorId: string;
  message?: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user?.id) {
    throw new Error("You must be logged in");
  }

  // Check if enrollment already exists
  const [existing] = await db
    .select()
    .from(tutorEnrollments)
    .where(and(
      eq(tutorEnrollments.tutorId, data.tutorId),
      eq(tutorEnrollments.learnerId, user.id)
    ))
    .limit(1);

  if (existing) {
    if (existing.status === "pending") {
      throw new Error("You already have a pending enrollment request with this tutor");
    } else if (existing.status === "accepted") {
      throw new Error("You are already enrolled with this tutor");
    } else {
      // Update existing rejected/removed enrollment to pending
      await db
        .update(tutorEnrollments)
        .set({
          status: "pending",
          message: data.message,
          updatedAt: new Date(),
        })
        .where(eq(tutorEnrollments.id, existing.id));
      
      // Notify tutor
      await createNotification({
        userId: data.tutorId,
        type: "lesson_completed",
        title: "New Enrollment Request",
        message: "You have a new enrollment request",
        data: { enrollmentId: existing.id },
      });

      revalidatePath("/tutoring");
      return { success: true, enrollmentId: existing.id };
    }
  }

  // Create new enrollment request
  const [enrollment] = await db
    .insert(tutorEnrollments)
    .values({
      tutorId: data.tutorId,
      learnerId: user.id,
      status: "pending",
      message: data.message,
    })
    .returning();

  // Notify tutor
  await createNotification({
    userId: data.tutorId,
    type: "lesson_completed",
    title: "New Enrollment Request",
    message: "You have a new enrollment request",
    data: { enrollmentId: enrollment.id },
  });

  revalidatePath("/tutoring");
  return { success: true, enrollmentId: enrollment.id };
}

export async function acceptTutorEnrollment(enrollmentId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user?.id) {
    throw new Error("You must be logged in");
  }

  // Get the enrollment
  const [enrollment] = await db
    .select()
    .from(tutorEnrollments)
    .where(eq(tutorEnrollments.id, enrollmentId))
    .limit(1);

  if (!enrollment || enrollment.tutorId !== user.id) {
    throw new Error("Enrollment not found or unauthorized");
  }

  if (enrollment.status !== "pending") {
    throw new Error("Enrollment is not pending");
  }

  // Update enrollment status
  await db
    .update(tutorEnrollments)
    .set({
      status: "accepted",
      startedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(tutorEnrollments.id, enrollmentId));

  // Update tutor profile stats
  await db
    .update(tutorProfiles)
    .set({
      activeLearners: sql`${tutorProfiles.activeLearners} + 1`,
      totalLearners: sql`${tutorProfiles.totalLearners} + 1`,
      updatedAt: new Date(),
    })
    .where(eq(tutorProfiles.tutorId, user.id));

  // Create learner stats if they don't exist
  const [existingLearnerStats] = await db
    .select()
    .from(learnerStats)
    .where(eq(learnerStats.learnerId, enrollment.learnerId))
    .limit(1);

  if (!existingLearnerStats) {
    await db.insert(learnerStats).values({
      learnerId: enrollment.learnerId,
    });
  } else {
    await db
      .update(learnerStats)
      .set({
        activeEnrollments: sql`${learnerStats.activeEnrollments} + 1`,
        totalEnrollments: sql`${learnerStats.totalEnrollments} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(learnerStats.learnerId, enrollment.learnerId));
  }

  // Notify learner
  await createNotification({
    userId: enrollment.learnerId,
    type: "lesson_completed",
    title: "Enrollment Accepted",
    message: "Your enrollment request has been accepted",
    data: { enrollmentId },
  });

  revalidatePath("/tutoring");
  revalidatePath("/tutoring/dashboard");
  return { success: true };
}

export async function declineTutorEnrollment(enrollmentId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user?.id) {
    throw new Error("You must be logged in");
  }

  // Get the enrollment
  const [enrollment] = await db
    .select()
    .from(tutorEnrollments)
    .where(eq(tutorEnrollments.id, enrollmentId))
    .limit(1);

  if (!enrollment || enrollment.tutorId !== user.id) {
    throw new Error("Enrollment not found or unauthorized");
  }

  if (enrollment.status !== "pending") {
    throw new Error("Enrollment is not pending");
  }

  // Update enrollment status
  await db
    .update(tutorEnrollments)
    .set({
      status: "rejected",
      updatedAt: new Date(),
    })
    .where(eq(tutorEnrollments.id, enrollmentId));

  // Notify learner
  await createNotification({
    userId: enrollment.learnerId,
    type: "lesson_completed",
    title: "Enrollment Declined",
    message: "Your enrollment request has been declined",
    data: { enrollmentId },
  });

  revalidatePath("/tutoring");
  revalidatePath("/tutoring/dashboard");
  return { success: true };
}

export async function getTutorEnrollments(tutorId?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user?.id) {
    return [];
  }

  const targetTutorId = tutorId || user.id;

  const enrollments = await db
    .select({
      id: tutorEnrollments.id,
      status: tutorEnrollments.status,
      message: tutorEnrollments.message,
      createdAt: tutorEnrollments.createdAt,
      learner: {
        id: profiles.id,
        displayName: profiles.displayName,
        avatarUrl: profiles.avatarUrl,
      },
    })
    .from(tutorEnrollments)
    .innerJoin(profiles, eq(tutorEnrollments.learnerId, profiles.id))
    .where(eq(tutorEnrollments.tutorId, targetTutorId))
    .orderBy(desc(tutorEnrollments.createdAt))
    .limit(50);

  return enrollments;
}

export async function getLearnerEnrollments() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user?.id) {
    return [];
  }

  const enrollments = await db
    .select({
      id: tutorEnrollments.id,
      status: tutorEnrollments.status,
      message: tutorEnrollments.message,
      createdAt: tutorEnrollments.createdAt,
      tutor: {
        id: profiles.id,
        displayName: profiles.displayName,
        avatarUrl: profiles.avatarUrl,
      },
      tutorProfile: {
        bio: tutorProfiles.bio,
        subjects: tutorProfiles.subjects,
        hourlyRate: tutorProfiles.hourlyRate,
      },
    })
    .from(tutorEnrollments)
    .innerJoin(profiles, eq(tutorEnrollments.tutorId, profiles.id))
    .leftJoin(tutorProfiles, eq(tutorEnrollments.tutorId, tutorProfiles.tutorId))
    .where(eq(tutorEnrollments.learnerId, user.id))
    .orderBy(desc(tutorEnrollments.createdAt))
    .limit(50);

  return enrollments;
}

// Task Actions
export async function createTask(data: {
  targetType: "learner" | "classroom";
  targetId: string;
  title: string;
  description?: string;
  dueDate?: Date;
  attachments?: any[];
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user?.id) {
    throw new Error("You must be logged in");
  }

  // Verify user is a tutor
  const [profile] = await db
    .select({ role: profiles.role })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);

  if (!profile || profile.role !== "tutor") {
    throw new Error("Only tutors can create tasks");
  }

  // If targeting a learner, verify enrollment
  if (data.targetType === "learner") {
    const [enrollment] = await db
      .select()
      .from(tutorEnrollments)
      .where(and(
        eq(tutorEnrollments.tutorId, user.id),
        eq(tutorEnrollments.learnerId, data.targetId),
        eq(tutorEnrollments.status, "accepted")
      ))
      .limit(1);

    if (!enrollment) {
      throw new Error("Learner is not enrolled with you");
    }
  }

  const [task] = await db
    .insert(tasks)
    .values({
      tutorId: user.id,
      targetType: data.targetType,
      targetId: data.targetId,
      title: data.title,
      description: data.description,
      dueDate: data.dueDate,
      attachments: data.attachments,
    })
    .returning();

  // Notify the learner if targeting a learner
  if (data.targetType === "learner") {
    await createNotification({
      userId: data.targetId,
      type: "lesson_completed",
      title: "New Task Assigned",
      message: `You have been assigned a new task: ${data.title}`,
      data: { taskId: task.id },
    });
  }

  revalidatePath("/tutoring");
  revalidatePath("/tutoring/dashboard");
  return { success: true, taskId: task.id };
}

export async function getTutorTasks() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user?.id) {
    return [];
  }

  const tasksList = await db
    .select({
      id: tasks.id,
      title: tasks.title,
      description: tasks.description,
      dueDate: tasks.dueDate,
      status: tasks.status,
      targetType: tasks.targetType,
      targetId: tasks.targetId,
      createdAt: tasks.createdAt,
      learner: {
        id: profiles.id,
        displayName: profiles.displayName,
        avatarUrl: profiles.avatarUrl,
      },
    })
    .from(tasks)
    .leftJoin(profiles, and(eq(tasks.targetId, profiles.id), eq(tasks.targetType, "learner")))
    .where(eq(tasks.tutorId, user.id))
    .orderBy(desc(tasks.createdAt))
    .limit(50);

  return tasksList;
}

export async function getLearnerTasks() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user?.id) {
    return [];
  }

  // Get tasks assigned directly to learner
  const directTasks = await db
    .select({
      id: tasks.id,
      title: tasks.title,
      description: tasks.description,
      dueDate: tasks.dueDate,
      status: tasks.status,
      targetType: tasks.targetType,
      targetId: tasks.targetId,
      createdAt: tasks.createdAt,
      tutor: {
        id: profiles.id,
        displayName: profiles.displayName,
        avatarUrl: profiles.avatarUrl,
      },
    })
    .from(tasks)
    .innerJoin(profiles, eq(tasks.tutorId, profiles.id))
    .where(and(
      eq(tasks.targetType, "learner"),
      eq(tasks.targetId, user.id)
    ))
    .orderBy(desc(tasks.createdAt))
    .limit(50);

  return directTasks;
}

export async function submitTask(data: {
  taskId: string;
  content: string;
  attachments?: any[];
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user?.id) {
    throw new Error("You must be logged in");
  }

  // Get the task
  const [task] = await db
    .select()
    .from(tasks)
    .where(eq(tasks.id, data.taskId))
    .limit(1);

  if (!task) {
    throw new Error("Task not found");
  }

  // Verify the task is assigned to this learner
  if (task.targetType === "learner" && task.targetId !== user.id) {
    throw new Error("This task is not assigned to you");
  }

  // Check if already submitted
  const [existingSubmission] = await db
    .select()
    .from(taskSubmissions)
    .where(and(
      eq(taskSubmissions.taskId, data.taskId),
      eq(taskSubmissions.learnerId, user.id)
    ))
    .limit(1);

  if (existingSubmission) {
    throw new Error("You have already submitted this task");
  }

  // Create submission
  await db.insert(taskSubmissions).values({
    taskId: data.taskId,
    learnerId: user.id,
    content: data.content,
    attachments: data.attachments,
  });

  // Update task status
  await db
    .update(tasks)
    .set({
      status: "submitted",
      submittedAt: new Date(),
    })
    .where(eq(tasks.id, data.taskId));

  // Notify tutor
  await createNotification({
    userId: task.tutorId,
    type: "lesson_completed",
    title: "Task Submitted",
    message: "A learner has submitted a task",
    data: { taskId: data.taskId },
  });

  revalidatePath("/tutoring");
  revalidatePath("/learner");
  return { success: true };
}

export async function gradeTask(data: {
  taskId: string;
  learnerId: string;
  score?: number;
  grade?: string;
  feedback?: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user?.id) {
    throw new Error("You must be logged in");
  }

  // Get the task
  const [task] = await db
    .select()
    .from(tasks)
    .where(eq(tasks.id, data.taskId))
    .limit(1);

  if (!task) {
    throw new Error("Task not found");
  }

  // Verify user is the tutor who created the task
  if (task.tutorId !== user.id) {
    throw new Error("You can only grade your own tasks");
  }

  // Update task with grade
  const updateData: any = {
    score: data.score,
    feedback: data.feedback,
    status: "graded",
    gradedAt: new Date(),
  };
  
  // Only include grade if it's a numeric value
  if (data.grade !== undefined) {
    const numericGrade = parseInt(data.grade, 10);
    if (!isNaN(numericGrade)) {
      updateData.grade = numericGrade;
    }
  }
  
  await db
    .update(tasks)
    .set(updateData)
    .where(eq(tasks.id, data.taskId));

  // Update learner stats
  const [learnerStat] = await db
    .select()
    .from(learnerStats)
    .where(eq(learnerStats.learnerId, data.learnerId))
    .limit(1);

  if (learnerStat) {
    await db
      .update(learnerStats)
      .set({
        completedTasks: sql`${learnerStats.completedTasks} + 1`,
        averageTaskScore: sql`CASE WHEN ${learnerStats.completedTasks} = 0 THEN ${data.score || 0} ELSE (${learnerStats.averageTaskScore} * ${learnerStats.completedTasks} + ${data.score || 0}) / (${learnerStats.completedTasks} + 1) END`,
        updatedAt: new Date(),
      })
      .where(eq(learnerStats.learnerId, data.learnerId));
  }

  // Notify learner
  await createNotification({
    userId: data.learnerId,
    type: "lesson_completed",
    title: "Task Graded",
    message: "Your task has been graded",
    data: { taskId: data.taskId },
  });

  revalidatePath("/tutoring");
  revalidatePath("/learner");
  return { success: true };
}

export async function getTaskSubmission(taskId: string, learnerId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user?.id) {
    return null;
  }

  const [submission] = await db
    .select()
    .from(taskSubmissions)
    .where(and(
      eq(taskSubmissions.taskId, taskId),
      eq(taskSubmissions.learnerId, learnerId)
    ))
    .limit(1);

  return submission;
}

// Badge Actions
export async function awardBadge(data: {
  learnerId: string;
  badgeId: string;
  context?: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user?.id) {
    throw new Error("You must be logged in");
  }

  // Verify user is a tutor
  const [profile] = await db
    .select({ role: profiles.role })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);

  if (!profile || profile.role !== "tutor") {
    throw new Error("Only tutors can award badges");
  }

  // Verify the learner is enrolled with this tutor
  const [enrollment] = await db
    .select()
    .from(tutorEnrollments)
    .where(and(
      eq(tutorEnrollments.tutorId, user.id),
      eq(tutorEnrollments.learnerId, data.learnerId),
      eq(tutorEnrollments.status, "accepted")
    ))
    .limit(1);

  if (!enrollment) {
    throw new Error("Learner is not enrolled with you");
  }

  // Check if badge exists
  const [badge] = await db
    .select()
    .from(badges)
    .where(eq(badges.id, data.badgeId))
    .limit(1);

  if (!badge) {
    throw new Error("Badge not found");
  }

  // Check if learner already has this badge
  const [existingBadge] = await db
    .select()
    .from(userBadges)
    .where(and(
      eq(userBadges.userId, data.learnerId),
      eq(userBadges.badgeId, data.badgeId)
    ))
    .limit(1);

  if (existingBadge) {
    throw new Error("Learner already has this badge");
  }

  // Award the badge
  await db.insert(userBadges).values({
    userId: data.learnerId,
    badgeId: data.badgeId,
    awardedByTutorId: user.id,
    context: data.context,
  });

  // Update tutor's badge awarded count
  await db
    .update(tutorProfiles)
    .set({
      badgesAwardedCount: sql`${tutorProfiles.badgesAwardedCount} + 1`,
      updatedAt: new Date(),
    })
    .where(eq(tutorProfiles.tutorId, user.id));

  // Update learner stats
  const [learnerStat] = await db
    .select()
    .from(learnerStats)
    .where(eq(learnerStats.learnerId, data.learnerId))
    .limit(1);

  if (learnerStat) {
    await db
      .update(learnerStats)
      .set({
        badgesEarnedCount: sql`${learnerStats.badgesEarnedCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(learnerStats.learnerId, data.learnerId));
  }

  // Notify learner
  await createNotification({
    userId: data.learnerId,
    type: "lesson_completed",
    title: "Badge Awarded!",
    message: `You have been awarded the ${badge.name} badge!`,
    data: { badgeId: data.badgeId },
  });

  revalidatePath("/tutoring");
  revalidatePath("/learner");
  return { success: true };
}

export async function getAvailableBadges() {
  const badgesList = await db
    .select()
    .from(badges)
    .orderBy(badges.name)
    .limit(50);

  return badgesList;
}

export async function getLearnerBadges(learnerId: string) {
  const learnerBadgesList = await db
    .select({
      id: userBadges.id,
      awardedAt: userBadges.awardedAt,
      context: userBadges.context,
      badge: {
        id: badges.id,
        name: badges.name,
        description: badges.description,
        iconUrl: badges.iconUrl,
        category: badges.category,
      },
      awardedBy: {
        id: profiles.id,
        displayName: profiles.displayName,
      },
    })
    .from(userBadges)
    .innerJoin(badges, eq(userBadges.badgeId, badges.id))
    .leftJoin(profiles, eq(userBadges.awardedByTutorId, profiles.id))
    .where(eq(userBadges.userId, learnerId))
    .orderBy(desc(userBadges.awardedAt))
    .limit(50);

  return learnerBadgesList;
}

export async function getTutorAwardedBadges(tutorId?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user?.id) {
    return [];
  }

  const targetTutorId = tutorId || user.id;

  const awardedBadges = await db
    .select({
      id: userBadges.id,
      awardedAt: userBadges.awardedAt,
      context: userBadges.context,
      badge: {
        id: badges.id,
        name: badges.name,
        description: badges.description,
        iconUrl: badges.iconUrl,
      },
      learner: {
        id: profiles.id,
        displayName: profiles.displayName,
        avatarUrl: profiles.avatarUrl,
      },
    })
    .from(userBadges)
    .innerJoin(badges, eq(userBadges.badgeId, badges.id))
    .innerJoin(profiles, eq(userBadges.userId, profiles.id))
    .where(eq(userBadges.awardedByTutorId, targetTutorId))
    .orderBy(desc(userBadges.awardedAt))
    .limit(50);

  return awardedBadges;
}

// Ranking/Level System Actions
export async function calculateRankLevel(points: number): Promise<number> {
  // Simple ranking system: level = floor(sqrt(points / 100)) + 1
  // Level 1: 0-99 points
  // Level 2: 100-399 points
  // Level 3: 400-899 points
  // Level 4: 900-1599 points
  // etc.
  return Math.floor(Math.sqrt(points / 100)) + 1;
}

export async function awardRankPoints(data: {
  userId: string;
  points: number;
  reason: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user?.id) {
    throw new Error("You must be logged in");
  }

  // Update user's rank points
  await db
    .update(profiles)
    .set({
      rankPoints: sql`${profiles.rankPoints} + ${data.points}`,
      updatedAt: new Date(),
    })
    .where(eq(profiles.id, data.userId));

  // Get updated profile to check for level up
  const [updatedProfile] = await db
    .select({ rankPoints: profiles.rankPoints, rankLevel: profiles.rankLevel })
    .from(profiles)
    .where(eq(profiles.id, data.userId))
    .limit(1);

  if (updatedProfile && updatedProfile.rankPoints !== null) {
    const newLevel = await calculateRankLevel(updatedProfile.rankPoints);
    
    if (updatedProfile.rankLevel !== null && newLevel > updatedProfile.rankLevel) {
      // Level up!
      await db
        .update(profiles)
        .set({ rankLevel: newLevel })
        .where(eq(profiles.id, data.userId));

      // Notify user of level up
      await createNotification({
        userId: data.userId,
        type: "lesson_completed",
        title: "Level Up!",
        message: `Congratulations! You've reached Level ${newLevel}!`,
        data: { newLevel, reason: data.reason },
      });
    }
  }

  revalidatePath("/tutoring");
  revalidatePath("/learner");
  return { success: true };
}

export async function awardTutorRankPoints(data: {
  tutorId: string;
  points: number;
  reason: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user?.id) {
    throw new Error("You must be logged in");
  }

  // Update tutor's rank points
  await db
    .update(tutorProfiles)
    .set({
      rankPoints: sql`${tutorProfiles.rankPoints} + ${data.points}`,
      updatedAt: new Date(),
    })
    .where(eq(tutorProfiles.tutorId, data.tutorId));

  // Get updated profile to check for level up
  const [updatedProfile] = await db
    .select({ rankPoints: tutorProfiles.rankPoints, rankLevel: tutorProfiles.rankLevel })
    .from(tutorProfiles)
    .where(eq(tutorProfiles.tutorId, data.tutorId))
    .limit(1);

  if (updatedProfile && updatedProfile.rankPoints !== null) {
    const newLevel = await calculateRankLevel(updatedProfile.rankPoints);
    
    if (updatedProfile.rankLevel !== null && newLevel > updatedProfile.rankLevel) {
      // Level up!
      await db
        .update(tutorProfiles)
        .set({ rankLevel: newLevel })
        .where(eq(tutorProfiles.tutorId, data.tutorId));

      // Notify tutor of level up
      await createNotification({
        userId: data.tutorId,
        type: "lesson_completed",
        title: "Tutor Level Up!",
        message: `Congratulations! You've reached Tutor Level ${newLevel}!`,
        data: { newLevel, reason: data.reason },
      });
    }
  }

  revalidatePath("/tutoring");
  return { success: true };
}

export async function getLeaderboard(limit: number = 10) {
  const leaderboard = await db
    .select({
      id: profiles.id,
      displayName: profiles.displayName,
      avatarUrl: profiles.avatarUrl,
      rankLevel: profiles.rankLevel,
      rankPoints: profiles.rankPoints,
      role: profiles.role,
    })
    .from(profiles)
    .orderBy(desc(profiles.rankPoints))
    .limit(limit);

  return leaderboard;
}

export async function getTutorLeaderboard(limit: number = 10) {
  const leaderboard = await db
    .select({
      id: tutorProfiles.tutorId,
      displayName: profiles.displayName,
      avatarUrl: profiles.avatarUrl,
      rankLevel: tutorProfiles.rankLevel,
      rankPoints: tutorProfiles.rankPoints,
      totalSessions: tutorProfiles.totalSessions,
      rating: tutorProfiles.rating,
      activeLearners: tutorProfiles.activeLearners,
    })
    .from(tutorProfiles)
    .innerJoin(profiles, eq(tutorProfiles.tutorId, profiles.id))
    .where(eq(tutorProfiles.isActive, true))
    .orderBy(desc(tutorProfiles.rankPoints))
    .limit(limit);

  return leaderboard;
}
