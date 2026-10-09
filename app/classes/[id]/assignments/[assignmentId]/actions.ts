"use server";

import { db } from "@/db";
import { submissions, assignments } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function submitAssignment(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const assignmentId = formData.get("assignmentId") as string;
  const groupId = formData.get("groupId") as string;
  const textResponse = formData.get("textResponse") as string;

  if (!assignmentId) {
    throw new Error("Assignment ID is required");
  }

  try {
    const [submission] = await db
      .insert(submissions)
      .values({
        assignmentId,
        studentId: user.id,
        status: "submitted",
      })
      .returning();

    // Notify tutor of new submission
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
          type: "lesson_completed",
          title: "New Assignment Submission",
          message: `${user.email?.split("@")[0] || "A student"} submitted "${assignment.title}"`,
          data: { assignmentId, submissionId: submission.id, groupId },
        });
      }
    } catch (notifErr) {
      console.warn("Failed to notify tutor of submission:", notifErr);
    }

    revalidatePath(`/classes/${groupId}`);
    redirect(`/classes/${groupId}/assignments/${assignmentId}`);
  } catch (error: any) {
    if (error?.digest?.startsWith("NEXT_REDIRECT")) {
      throw error;
    }
    console.error("Error submitting assignment:", error);
    if (error.code === "23505") {
      throw new Error("You have already submitted this assignment.");
    }
    throw new Error(error.message || "Failed to submit assignment. Please try again.");
  }
}

