"use server";

import { db } from "@/db";
import { quizQuestions, quizOptions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createQuestion(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const quizId = formData.get("quizId") as string;
  const groupId = formData.get("groupId") as string;
  const assignmentId = formData.get("assignmentId") as string;
  const questionText = formData.get("questionText") as string;
  const questionType = formData.get("questionType") as "multiple_choice" | "true_false" | "short_answer" | "essay";
  const points = parseInt(formData.get("points") as string);

  if (!quizId || !questionText || !questionType || !points) {
    throw new Error("Missing required fields");
  }

  try {
    // Create the question
    const [question] = await db
      .insert(quizQuestions)
      .values({
        quizId,
        questionText,
        questionType,
        points,
        orderIndex: 0, // Will be updated later
      })
      .returning();

    // If multiple choice, create options
    if (questionType === "multiple_choice") {
      const correctOption = formData.get("correctOption") as string;
      const options: { optionText: string; isCorrect: boolean; orderIndex: number }[] = [];

      for (let i = 1; i <= 4; i++) {
        const optionText = formData.get(`option${i}`) as string;
        if (optionText && optionText.trim()) {
          options.push({
            optionText: optionText.trim(),
            isCorrect: correctOption === i.toString(),
            orderIndex: i,
          });
        }
      }

      if (options.length > 0) {
        await db.insert(quizOptions).values(
          options.map((opt) => ({
            questionId: question.id,
            ...opt,
          }))
        );
      }
    }

    revalidatePath(`/tutoring/classes/${groupId}/assignments/${assignmentId}/quiz/${quizId}/questions`);
    redirect(`/tutoring/classes/${groupId}/assignments/${assignmentId}/quiz/${quizId}/questions`);
  } catch (error: any) {
    console.error("Error creating question:", error);
    throw new Error(error.message || "Failed to create question. Please try again.");
  }
}
