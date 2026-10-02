import { createClient } from "@/utils/supabase/server";
import { db } from "@/db";
import { groups, groupMembers, profiles, assignments, quizzes, quizQuestions, quizOptions, quizAttempts, quizAnswers } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import QuizClient from "./QuizClient";

interface PageProps {
  params: Promise<{ id: string; assignmentId: string; quizId: string }>;
}

export default async function QuizPage({ params }: PageProps) {
  const { id, assignmentId, quizId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  // Fetch user profile to check role
  const [profile] = await db
    .select({ role: profiles.role })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);

  // Only learners can access this page
  if (profile?.role !== "learner") {
    redirect("/tutoring/classes");
  }

  // Fetch assignment
  const [assignment] = await db
    .select()
    .from(assignments)
    .where(eq(assignments.id, assignmentId))
    .limit(1);

  if (!assignment) {
    notFound();
  }

  // Verify assignment belongs to the group
  if (assignment.groupId !== id) {
    redirect(`/classes/${id}`);
  }

  // Fetch quiz details
  const [quiz] = await db
    .select()
    .from(quizzes)
    .where(eq(quizzes.id, quizId))
    .limit(1);

  if (!quiz) {
    notFound();
  }

  // Verify quiz belongs to the assignment
  if (quiz.assignmentId !== assignmentId) {
    redirect(`/classes/${id}`);
  }

  // Fetch group to verify membership
  const [group] = await db
    .select()
    .from(groups)
    .where(eq(groups.id, id))
    .limit(1);

  // Verify user is a member of this group
  const [member] = await db
    .select()
    .from(groupMembers)
    .where(
      and(
        eq(groupMembers.groupId, id),
        eq(groupMembers.userId, user.id)
      )
    )
    .limit(1);

  if (!member) {
    redirect(`/classes/${id}`);
  }

  // Fetch quiz questions with options
  const questions = await db
    .select({
      id: quizQuestions.id,
      questionText: quizQuestions.questionText,
      questionType: quizQuestions.questionType,
      points: quizQuestions.points,
      orderIndex: quizQuestions.orderIndex,
    })
    .from(quizQuestions)
    .where(eq(quizQuestions.quizId, quizId))
    .orderBy(quizQuestions.orderIndex);

  // Fetch options for each question
  const questionsWithOptions = await Promise.all(
    questions.map(async (question) => {
      const options = await db
        .select({
          id: quizOptions.id,
          optionText: quizOptions.optionText,
          orderIndex: quizOptions.orderIndex,
        })
        .from(quizOptions)
        .where(eq(quizOptions.questionId, question.id))
        .orderBy(quizOptions.orderIndex);

      return {
        ...question,
        options,
      };
    })
  );

  // Fetch previous attempts
  const attempts = await db
    .select()
    .from(quizAttempts)
    .where(
      and(
        eq(quizAttempts.quizId, quizId),
        eq(quizAttempts.studentId, user.id)
      )
    )
    .orderBy(desc(quizAttempts.startedAt));

  // Check if student has reached max attempts
  const attemptsRemaining = quiz.maxAttempts - attempts.length;

  return (
    <div className="w-full px-8 py-8 bg-gradient-to-br from-background via-blue-50 to-cyan-50 min-h-screen">
      {/* Header */}
      <div className="relative w-full bg-gradient-to-br from-blue-500 via-cyan-500 to-teal-500 rounded-3xl p-1 shadow-2xl overflow-hidden mb-8">
        <div className="absolute inset-0 rounded-3xl border-4 border-dashed border-white/40 pointer-events-none"></div>
        <div className="relative bg-white/95 backdrop-blur-sm rounded-2xl p-8 md:p-10">
          <div className="relative z-10 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Link
                href={`/classes/${id}`}
                className="inline-flex items-center gap-1 text-text-muted hover:text-primary font-label-sm font-semibold"
              >
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                Back to Class
              </Link>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-4 py-1 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-label-sm text-label-sm tracking-wider uppercase font-bold shadow-lg border-2 border-white/30">🧠 Quiz</span>
              </div>
              <h1 className="font-headline-xl text-headline-xl text-text-primary tracking-tight leading-none">
                Quiz
              </h1>
              <div className="flex flex-wrap items-center gap-4">
                {quiz.timeLimit && (
                  <p className="font-body-md text-text-muted">
                    Time Limit: {quiz.timeLimit} minutes
                  </p>
                )}
                <p className="font-label-md font-semibold text-primary">
                  {questions.length} Questions
                </p>
                <p className="font-label-md font-semibold text-text-muted">
                  Attempts: {attempts.length}/{quiz.maxAttempts}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Previous Attempts */}
      {attempts.length > 0 && (
        <div className="rounded-2xl bg-surface p-6 shadow-clay-surface border border-surface-border mb-6">
          <h2 className="font-headline-lg text-headline-lg text-text-primary font-bold mb-4">
            Previous Attempts
          </h2>
          <div className="space-y-3">
            {attempts.map((attempt) => (
              <div
                key={attempt.id}
                className="flex items-center justify-between p-4 bg-surface-container rounded-xl"
              >
                <div>
                  <p className="font-label-md font-semibold text-text-primary">
                    {new Date(attempt.startedAt).toLocaleString()}
                  </p>
                  {attempt.completedAt && (
                    <p className="font-body-sm text-text-muted">
                      Completed: {new Date(attempt.completedAt).toLocaleString()}
                    </p>
                  )}
                </div>
                {attempt.score !== null && (
                  <div className="text-right">
                    <p className="font-headline-xl text-headline-xl text-primary font-bold">
                      {attempt.score}%
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quiz Interface */}
      {attemptsRemaining > 0 ? (
        <QuizClient
          quizId={quizId}
          assignmentId={assignmentId}
          groupId={id}
          questions={questionsWithOptions}
          quiz={quiz}
          attemptsRemaining={attemptsRemaining}
        />
      ) : (
        <div className="rounded-2xl bg-gradient-to-br from-red-50 to-rose-50 p-12 text-center shadow-xl border-4 border-red-200">
          <span className="material-symbols-outlined text-red-500 text-[64px]">block</span>
          <h2 className="font-headline-lg text-headline-lg text-red-700 font-bold mt-4 mb-2">
            No Attempts Remaining
          </h2>
          <p className="font-body-md text-red-600">
            You have used all {quiz.maxAttempts} attempts for this quiz.
          </p>
        </div>
      )}
    </div>
  );
}
