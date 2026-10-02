"use server";

import { db } from "@/db";
import { quizAttempts, quizAnswers, quizOptions } from "@/db/schema";
import { createClient } from "@/utils/supabase/server";
import { eq } from "drizzle-orm";
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

  if (!quizId) {
    throw new Error("Quiz ID is required");
  }

  try {
    // Create quiz attempt
    const [attempt] = await db
      .insert(quizAttempts)
      .values({
        quizId,
        studentId: user.id,
        startedAt: new Date(),
        completedAt: new Date(),
        score: null,
      })
      .returning();

    // Process answers
    const answerKeys = Array.from(formData.keys()).filter(key => key.startsWith("answer_"));
    const textKeys = Array.from(formData.keys()).filter(key => key.startsWith("text_"));

    let correctCount = 0;
    let totalPoints = 0;

    for (const key of answerKeys) {
      const questionId = key.replace("answer_", "");
      const selectedOptionId = formData.get(key) as string;

      if (selectedOptionId) {
        // Fetch the option to check if it's correct
        const [option] = await db
          .select({ isCorrect: quizOptions.isCorrect, points: quizOptions.id })
          .from(quizOptions)
          .where(eq(quizOptions.id, selectedOptionId))
          .limit(1);

        const isCorrect = option?.isCorrect || false;
        if (isCorrect) correctCount++;

        await db.insert(quizAnswers).values({
          attemptId: attempt.id,
          questionId,
          selectedOptionId,
          isCorrect,
          pointsEarned: isCorrect ? 1 : 0,
        });
      }
    }

    for (const key of textKeys) {
      const questionId = key.replace("text_", "");
      const textAnswer = formData.get(key) as string;

      if (textAnswer) {
        await db.insert(quizAnswers).values({
          attemptId: attempt.id,
          questionId,
          textAnswer,
          isCorrect: null,
          pointsEarned: null,
        });
      }
    }

    // Calculate score (simple percentage for now)
    const score = answerKeys.length > 0 ? Math.round((correctCount / answerKeys.length) * 100) : 0;

    await db
      .update(quizAttempts)
      .set({ score })
      .where(eq(quizAttempts.id, attempt.id));

    revalidatePath(`/classes/${groupId}`);
    redirect(`/classes/${groupId}`);
  } catch (error: any) {
    console.error("Error submitting quiz:", error);
    throw new Error("Failed to submit quiz. Please try again.");
  }
}
