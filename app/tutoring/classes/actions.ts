"use server";

import { db } from "@/db";
import { groups, assignments, quizzes, notifications } from "@/db/schema";
import { createClient } from "@/utils/supabase/server";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";

export async function createGroup(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const subject = formData.get("subject") as string;
  const gradeLevel = formData.get("gradeLevel") as string;
  const privacy = formData.get("privacy") as string;
  const coverImageUrl = formData.get("coverImageUrl") as string;
  let groupCode = formData.get("groupCode") as string;

  if (!name || name.trim().length === 0) {
    throw new Error("Class name is required");
  }

  // Auto-generate group code if not provided
  if (!groupCode || groupCode.trim().length === 0) {
    groupCode = nanoid(6).toUpperCase();
  }

  let groupId: string;
  try {
    const [group] = await db
      .insert(groups)
      .values({
        tutorId: user.id,
        name: name.trim(),
        description: description?.trim() || null,
        subject: subject?.trim() || null,
        gradeLevel: gradeLevel || null,
        coverImageUrl: coverImageUrl?.trim() || null,
        groupCode: groupCode.toUpperCase(),
        privacy: (privacy === "public" || privacy === "private" || privacy === "invite_only") ? privacy : "private",
      })
      .returning();

    groupId = group.id;
    revalidatePath("/tutoring/classes");
  } catch (error: any) {
    console.error("Error creating group:", error);
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      detail: error.detail,
      hint: error.hint,
    });
    if (error.code === "23505") {
      throw new Error("A class with this code already exists. Please use a different code.");
    }
    if (error.code === "23503") {
      throw new Error("Invalid tutor ID. Please ensure your profile is set up correctly.");
    }
    throw new Error(`Failed to create class: ${error.message || "Unknown error"}`);
  }

  redirect(`/tutoring/classes/${groupId}`);
}

export async function getTutorGroups(tutorId: string) {
  const groups = await db.query.groups.findMany({
    where: (groups, { eq }) => eq(groups.tutorId, tutorId),
    orderBy: (groups, { desc }) => [desc(groups.createdAt)],
  });

  return groups;
}

export async function getGroupById(groupId: string) {
  const [group] = await db.query.groups.findMany({
    where: (groups, { eq }) => eq(groups.id, groupId),
  });

  return group;
}

export async function getGroupMembers(groupId: string) {
  const members = await db.query.groupMembers.findMany({
    where: (groupMembers, { eq }) => eq(groupMembers.groupId, groupId),
    with: {
      user: true,
    },
  });

  return members;
}

export async function createAssignment(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const groupId = formData.get("groupId") as string;
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const dueDate = formData.get("dueDate") as string;
  const points = formData.get("points") as string;
  const status = formData.get("status") as string;

  if (!title || title.trim().length === 0) {
    throw new Error("Assignment title is required");
  }

  if (!points || isNaN(parseInt(points))) {
    throw new Error("Valid points value is required");
  }

  let assignmentId: string;
  try {
    const [assignment] = await db
      .insert(assignments)
      .values({
        groupId,
        tutorId: user.id,
        title: title.trim(),
        description: description?.trim() || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        points: parseInt(points),
        status: (status === "published" || status === "draft") ? status : "draft",
      })
      .returning();

    assignmentId = assignment.id;

    // Send notifications to enrolled students if assignment is published
    if (assignment.status === "published") {
      try {
        const members = await db.query.groupMembers.findMany({
          where: (gm, { eq }) => eq(gm.groupId, groupId),
        });

        for (const member of members) {
          if (member.userId !== user.id) {
            await db.insert(notifications).values({
              userId: member.userId,
              type: "lesson_completed", // Using valid notification type
              title: "New Assignment Posted",
              message: `A new assignment "${assignment.title}" has been published.`,
              data: {
                assignmentId: assignment.id,
                groupId,
                actionUrl: `/classes/${groupId}/assignments/${assignment.id}`,
              },
            });
          }
        }
      } catch (notifyErr) {
        console.error("Failed to notify students of new assignment:", notifyErr);
      }
    }

    revalidatePath(`/tutoring/classes/${groupId}`);
  } catch (error: any) {
    if (error?.digest?.startsWith?.("NEXT_REDIRECT")) {
      throw error;
    }
    console.error("Error creating assignment:", error);
    throw new Error("Failed to create assignment. Please try again.");
  }

  redirect(`/tutoring/classes/${groupId}/assignments/${assignmentId}`);
}

export async function deleteAssignment(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const assignmentId = formData.get("assignmentId") as string;
  const groupId = formData.get("groupId") as string;

  if (!assignmentId) {
    throw new Error("Assignment ID is required");
  }

  // Verify assignment belongs to the user
  const [assignment] = await db
    .select()
    .from(assignments)
    .where(eq(assignments.id, assignmentId))
    .limit(1);

  if (!assignment) {
    throw new Error("Assignment not found");
  }

  if (assignment.tutorId !== user.id) {
    throw new Error("Unauthorized");
  }

  try {
    await db
      .delete(assignments)
      .where(eq(assignments.id, assignmentId));

    revalidatePath(`/tutoring/classes/${groupId}`);
    revalidatePath(`/tutoring/classes/${groupId}/assignments`);
  } catch (error: any) {
    console.error("Error deleting assignment:", error);
    throw new Error("Failed to delete assignment. Please try again.");
  }

  redirect(`/tutoring/classes/${groupId}/assignments`);
}

export async function editAssignment(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const assignmentId = formData.get("assignmentId") as string;
  const groupId = formData.get("groupId") as string;
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const dueDate = formData.get("dueDate") as string;
  const points = formData.get("points") as string;
  const status = formData.get("status") as string;

  if (!assignmentId) {
    throw new Error("Assignment ID is required");
  }

  if (!title || title.trim().length === 0) {
    throw new Error("Assignment title is required");
  }

  if (!points || isNaN(parseInt(points))) {
    throw new Error("Valid points value is required");
  }

  // Verify assignment belongs to the user
  const [existingAssignment] = await db
    .select()
    .from(assignments)
    .where(eq(assignments.id, assignmentId))
    .limit(1);

  if (!existingAssignment) {
    throw new Error("Assignment not found");
  }

  if (existingAssignment.tutorId !== user.id) {
    throw new Error("Unauthorized");
  }

  try {
    await db
      .update(assignments)
      .set({
        title: title.trim(),
        description: description?.trim() || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        points: parseInt(points),
        status: (status === "published" || status === "draft") ? status : "draft",
      })
      .where(eq(assignments.id, assignmentId));

    revalidatePath(`/tutoring/classes/${groupId}`);
    revalidatePath(`/tutoring/classes/${groupId}/assignments`);
  } catch (error: any) {
    console.error("Error updating assignment:", error);
    throw new Error("Failed to update assignment. Please try again.");
  }

  redirect(`/tutoring/classes/${groupId}/assignments/${assignmentId}`);
}

export async function createQuiz(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const assignmentId = formData.get("assignmentId") as string;
  const groupId = formData.get("groupId") as string;
  const timeLimit = formData.get("timeLimit") as string;
  const maxAttempts = formData.get("maxAttempts") as string;
  const allowRetakes = formData.get("allowRetakes") === "on";
  const randomizeQuestions = formData.get("randomizeQuestions") === "on";
  const showResultsAfter = formData.get("showResultsAfter") === "on";

  if (!assignmentId) {
    throw new Error("Assignment ID is required");
  }

  let quizId: string;
  try {
    const [quiz] = await db
      .insert(quizzes)
      .values({
        assignmentId,
        timeLimit: timeLimit ? parseInt(timeLimit) : null,
        maxAttempts: maxAttempts ? parseInt(maxAttempts) : 1,
        allowRetakes,
        randomizeQuestions,
        showResultsAfter,
      })
      .returning();

    quizId = quiz.id;
    revalidatePath(`/tutoring/classes/${groupId}`);
  } catch (error: any) {
    console.error("Error creating quiz:", error);
    throw new Error("Failed to create quiz. Please try again.");
  }

  redirect(`/tutoring/classes/${groupId}/assignments/${assignmentId}/quiz/${quizId}/questions`);
}
