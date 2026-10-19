"use server";

import { db } from "@/db";
import { submissions, assignments } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function submitQuiz(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const quizId = formData.get("quizId") as string;
  const groupId = formData.get("groupId") as string;
  const assignmentId = formData.get("assignmentId") as string;

  if (!quizId || !assignmentId) {
    throw new Error("Missing required fields");
  }

  try {
    // Collect all answers from form data
    const answers: Record<string, string> = {};
    for (const [key, value] of formData.entries()) {
      if (key.startsWith("question_") && value) {
        answers[key] = value as string;
      }
    }

    if (Object.keys(answers).length === 0) {
      throw new Error("Please answer at least one question");
    }

    // Create submission record
    const [submission] = await db
      .insert(submissions)
      .values({
        assignmentId,
        studentId: user.id,
        status: "submitted",
      })
      .returning();

    // TODO: Grade the quiz and update pointsEarned
    // This would require fetching the quiz questions and correct answers
    // For now, we'll just mark as submitted

    // Notify tutor of new quiz submission
    try {
      const [assignment] = await db
        .select()
        .from(assignments)
        .where(eq(assignments.id, assignmentId))
        .limit(1);

      if (assignment?.tutorId) {
        const { createNotification } = await import("@/app/notifications/actions");
        await createNotification({
          userId: assignment.tutorId,
          type: "quiz_submitted",
          title: "Quiz Submitted",
          message: `${user.email?.split("@")[0] || "A student"} submitted the quiz for "${assignment.title}"`,
          data: { assignmentId, submissionId: submission.id, groupId, quizId },
        });
      }
    } catch (notifErr) {
      console.warn("Failed to notify tutor of quiz submission:", notifErr);
    }

    revalidatePath(`/classes/${groupId}`);
    redirect(`/classes/${groupId}/assignments/${assignmentId}`);
  } catch (error: any) {
    if (error?.digest?.startsWith("NEXT_REDIRECT")) {
      throw error;
    }
    console.error("Error submitting quiz:", error);
    if (error.code === "23505") {
      throw new Error("You have already submitted this assignment.");
    }
    throw new Error(error.message || "Failed to submit quiz. Please try again.");
  }
}
