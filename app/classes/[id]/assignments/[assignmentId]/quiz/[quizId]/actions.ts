"use server";

import { db } from "@/db";
import { quizAttempts, quizAnswers, quizOptions } from "@/db/schema";
import { createClient } from "@/utils/supabase/server";
import { eq, inArray } from "drizzle-orm";
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

    // Process answers in batch
    const answerKeys = Array.from(formData.keys()).filter((key) => key.startsWith("answer_"));
    const textKeys = Array.from(formData.keys()).filter((key) => key.startsWith("text_"));

    const optionIds = answerKeys
      .map((k) => formData.get(k) as string)
      .filter(Boolean);

    // Fetch all chosen options in a single batch query
    let optionsMap = new Map<string, boolean>();
    if (optionIds.length > 0) {
      const fetchedOptions = await db
        .select({ id: quizOptions.id, isCorrect: quizOptions.isCorrect })
        .from(quizOptions)
        .where(inArray(quizOptions.id, optionIds));

      fetchedOptions.forEach((opt) => optionsMap.set(opt.id, opt.isCorrect));
    }

    let correctCount = 0;
    const answersToInsert: any[] = [];

    for (const key of answerKeys) {
      const questionId = key.replace("answer_", "");
      const selectedOptionId = formData.get(key) as string;

      if (selectedOptionId) {
        const isCorrect = optionsMap.get(selectedOptionId) || false;
        if (isCorrect) correctCount++;

        answersToInsert.push({
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
        answersToInsert.push({
          attemptId: attempt.id,
          questionId,
          textAnswer,
          isCorrect: null,
          pointsEarned: null,
        });
      }
    }

    if (answersToInsert.length > 0) {
      await db.insert(quizAnswers).values(answersToInsert);
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
    if (error?.digest?.startsWith?.("NEXT_REDIRECT")) {
      throw error;
    }
    console.error("Error submitting quiz:", error);
    throw new Error("Failed to submit quiz. Please try again.");
  }
}
