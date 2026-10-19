import { createClient } from "@/utils/supabase/server";
import { db } from "@/db";
import { groups, groupMembers, profiles, assignments, quizzes, quizQuestions, quizOptions } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import Mascot from "@/components/Mascot";
import { submitQuiz } from "./actions";

interface PageProps {
  params: Promise<{ id: string; assignmentId: string }>;
}

export default async function QuizPage({ params }: PageProps) {
  const { id, assignmentId } = await params;
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

  // Fetch assignment details
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

  // Fetch quiz for this assignment
  const [quiz] = await db
    .select()
    .from(quizzes)
    .where(eq(quizzes.assignmentId, assignmentId))
    .limit(1);

  if (!quiz) {
    return (
      <div className="w-full px-8 py-8 bg-gradient-to-br from-background via-tertiary/10 to-tertiary/10 min-h-screen">
        <div className="rounded-[24px] bg-surface p-12 text-center shadow-clay-surface border-4 border-surface/50">
          <Mascot pose="empty" size={96} />
          <h2 className="font-headline-lg text-headline-lg text-text-primary font-bold mt-4 mb-2">No Quiz Available</h2>
          <p className="font-body-md text-text-muted mb-6">
            Your tutor hasn't created a quiz for this assignment yet.
          </p>
          <Link
            href={`/classes/${id}/assignments/${assignmentId}`}
            className="inline-flex items-center gap-2 rounded-full bg-tertiary text-text-primary px-6 py-3 font-label-md font-bold shadow-clay-surface border-2 border-surface/30 transform hover:scale-105 transition-all active:scale-95"
          >
            Back to Assignment
          </Link>
        </div>
      </div>
    );
  }

  // Fetch questions for this quiz
  const questions = await db
    .select()
    .from(quizQuestions)
    .where(eq(quizQuestions.quizId, quiz.id))
    .orderBy(quizQuestions.orderIndex);

  // Fetch options for each question
  const questionsWithOptions = await Promise.all(
    questions.map(async (question) => {
      const options = await db
        .select()
        .from(quizOptions)
        .where(eq(quizOptions.questionId, question.id))
        .orderBy(quizOptions.orderIndex);

      return {
        ...question,
        options,
      };
    })
  );

  return (
    <div className="w-full px-8 py-8 bg-gradient-to-br from-background via-tertiary/10 to-tertiary/10 min-h-screen">
      {/* Header */}
      <div className="relative w-full bg-tertiary rounded-3xl p-1 shadow-clay-surface overflow-hidden mb-8">
        <div className="absolute inset-0 rounded-3xl border-4 border-dashed border-surface/40 pointer-events-none"></div>
        <div className="relative bg-surface/95 backdrop-blur-sm rounded-[24px] p-8 md:p-10">
          <div className="relative z-10 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Link
                href={`/classes/${id}/assignments/${assignmentId}`}
                className="inline-flex items-center gap-1 text-text-muted hover:text-primary font-label-sm font-semibold"
              >
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                Back to Assignment
              </Link>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-4 py-1 rounded-full bg-tertiary text-text-primary font-label-sm text-label-sm tracking-wider uppercase font-bold shadow-clay-surface border-2 border-surface/30">🧠 Quiz</span>
              </div>
              <h1 className="font-headline-xl text-headline-xl text-text-primary tracking-tight leading-none">
                {assignment.title} - Quiz
              </h1>
              <div className="flex flex-wrap items-center gap-4">
                <p className="font-body-md text-text-muted">
                  {questionsWithOptions.length} questions
                </p>
                <p className="font-label-md font-semibold text-primary">
                  {assignment.points} points total
                </p>
                {quiz.timeLimit && (
                  <p className="font-body-sm text-text-muted">
                    Time limit: {quiz.timeLimit} minutes
                  </p>
                )}
                <p className="font-body-sm text-text-muted">
                  Max attempts: {quiz.maxAttempts}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quiz Instructions */}
      <div className="rounded-[24px] bg-surface p-6 shadow-clay-surface border border-surface-border mb-6">
        <h2 className="font-headline-lg text-headline-lg text-text-primary font-bold mb-4">Instructions</h2>
        <ul className="space-y-2 font-body-md text-text-muted">
          <li className="flex items-start gap-2">
            <span className="material-symbols-outlined text-tertiary text-[20px]">check_circle</span>
            <span>Read each question carefully before answering</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="material-symbols-outlined text-tertiary text-[20px]">check_circle</span>
            <span>Select the best answer for multiple choice questions</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="material-symbols-outlined text-tertiary text-[20px]">check_circle</span>
            <span>You have {quiz.maxAttempts} attempt{quiz.maxAttempts > 1 ? 's' : ''} to complete this quiz</span>
          </li>
          {quiz.timeLimit && (
            <li className="flex items-start gap-2">
              <span className="material-symbols-outlined text-tertiary text-[20px]">check_circle</span>
              <span>Complete the quiz within {quiz.timeLimit} minutes</span>
            </li>
          )}
          {quiz.showResultsAfter && (
            <li className="flex items-start gap-2">
              <span className="material-symbols-outlined text-tertiary text-[20px]">check_circle</span>
              <span>Results will be shown immediately after submission</span>
            </li>
          )}
        </ul>
      </div>

      {/* Quiz Form */}
      <form action={submitQuiz} className="space-y-6">
        <input type="hidden" name="quizId" value={quiz.id} />
        <input type="hidden" name="groupId" value={id} />
        <input type="hidden" name="assignmentId" value={assignmentId} />

        {questionsWithOptions.map((question, idx) => (
          <div
            key={question.id}
            className="rounded-[24px] bg-surface p-6 shadow-clay-surface border border-surface-border"
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 rounded-full bg-tertiary text-text-primary font-label-sm font-bold">
                Q{idx + 1}
              </span>
              <span className="px-3 py-1 rounded-full bg-primary/10 text-primary font-label-sm font-semibold">
                {question.points} pts
              </span>
            </div>
            <p className="font-body-md text-text-primary mb-4">{question.questionText}</p>

            {question.questionType === "multiple_choice" && question.options.length > 0 && (
              <div className="space-y-3">
                {question.options.map((option) => (
                  <label
                    key={option.id}
                    className="flex items-center gap-3 p-4 rounded-xl border-2 border-surface-border hover:border-tertiary cursor-pointer transition-all"
                  >
                    <input
                      type="radio"
                      name={`question_${question.id}`}
                      value={option.id}
                      required
                      className="w-5 h-5 text-tertiary focus:ring-tertiary"
                    />
                    <span className="font-body-md text-text-primary">{option.optionText}</span>
                  </label>
                ))}
              </div>
            )}

            {question.questionType === "true_false" && (
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-4 rounded-xl border-2 border-surface-border hover:border-tertiary cursor-pointer transition-all">
                  <input
                    type="radio"
                    name={`question_${question.id}`}
                    value="true"
                    required
                    className="w-5 h-5 text-tertiary focus:ring-tertiary"
                  />
                  <span className="font-body-md text-text-primary">True</span>
                </label>
                <label className="flex items-center gap-3 p-4 rounded-xl border-2 border-surface-border hover:border-tertiary cursor-pointer transition-all">
                  <input
                    type="radio"
                    name={`question_${question.id}`}
                    value="false"
                    required
                    className="w-5 h-5 text-tertiary focus:ring-tertiary"
                  />
                  <span className="font-body-md text-text-primary">False</span>
                </label>
              </div>
            )}

            {(question.questionType === "short_answer" || question.questionType === "essay") && (
              <textarea
                name={`question_${question.id}`}
                required
                rows={question.questionType === "essay" ? 6 : 3}
                className="w-full rounded-xl border-2 border-surface-border px-4 py-3 font-body-md text-text-primary focus:border-tertiary focus:outline-none shadow-clay-surface-pressed bg-surface transition-all resize-none"
                placeholder={question.questionType === "essay" ? "Write your essay response here..." : "Type your short answer here..."}
              />
            )}
          </div>
        ))}

        {/* Submit Button */}
        <div className="flex items-center gap-4 pt-4 border-t border-surface-border">
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-full bg-tertiary text-text-primary px-6 py-3 font-label-md font-bold shadow-clay-primary border-2 border-surface/30 transform hover:scale-105 transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-[20px]">check</span>
            Submit Quiz
          </button>
          <Link
            href={`/classes/${id}/assignments/${assignmentId}`}
            className="inline-flex items-center gap-2 rounded-full bg-surface border-2 border-surface-border text-text-muted px-6 py-3 font-label-md font-semibold shadow-clay-surface hover:shadow-clay-primary transition-all"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
