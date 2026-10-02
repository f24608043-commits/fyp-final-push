"use server";

import { db } from "@/db";
import { submissions } from "@/db/schema";
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

    revalidatePath(`/classes/${groupId}`);
    redirect(`/classes/${groupId}/assignments/${assignmentId}`);
  } catch (error: any) {
    console.error("Error submitting assignment:", error);
    if (error.code === "23505") {
      throw new Error("You have already submitted this assignment.");
    }
    throw new Error("Failed to submit assignment. Please try again.");
  }
}

