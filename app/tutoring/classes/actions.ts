"use server";

import { db } from "@/db";
import { groups, assignments, quizzes } from "@/db/schema";
import { createClient } from "@/utils/supabase/server";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

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
        privacy: (privacy as any) || "private",
      })
      .returning();

    revalidatePath("/tutoring/classes");
    redirect(`/tutoring/classes/${group.id}`);
  } catch (error: any) {
    console.error("Error creating group:", error);
    if (error.code === "23505") {
      throw new Error("A class with this code already exists. Please use a different code.");
    }
    throw new Error("Failed to create class. Please try again.");
  }
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
        status: (status as any) || "draft",
      })
      .returning();

    revalidatePath(`/tutoring/classes/${groupId}`);
    redirect(`/tutoring/classes/${groupId}/assignments/${assignment.id}`);
  } catch (error: any) {
    console.error("Error creating assignment:", error);
    throw new Error("Failed to create assignment. Please try again.");
  }
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

    revalidatePath(`/tutoring/classes/${groupId}`);
    redirect(`/tutoring/classes/${groupId}/assignments/${assignmentId}/quiz/${quiz.id}/questions`);
  } catch (error: any) {
    console.error("Error creating quiz:", error);
    throw new Error("Failed to create quiz. Please try again.");
  }
}
