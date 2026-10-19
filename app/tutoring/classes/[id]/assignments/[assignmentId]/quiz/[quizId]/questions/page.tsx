import { createClient } from "@/utils/supabase/server";
import { db } from "@/db";
import { groups, profiles, assignments, quizzes, quizQuestions, quizOptions } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createQuestion } from "./actions";

interface PageProps {
  params: Promise<{ id: string; assignmentId: string; quizId: string }>;
}

export default async function QuizQuestionsPage({ params }: PageProps) {
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

  // Only tutors can access this page
  if (profile?.role !== "tutor") {
    redirect("/tutoring");
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
    redirect(`/tutoring/classes/${id}/assignments/${assignmentId}`);
  }

  // Fetch group to verify tutor ownership
  const [group] = await db
    .select()
    .from(groups)
    .where(eq(groups.id, id))
    .limit(1);

  if (!group || group.tutorId !== user.id) {
    redirect(`/tutoring/classes/${id}`);
  }

  // Fetch existing questions
  const questions = await db
    .select()
    .from(quizQuestions)
    .where(eq(quizQuestions.quizId, quizId))
    .orderBy(desc(quizQuestions.orderIndex));

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
    <div className="w-full px-8 py-8 bg-gradient-to-br from-surface via-secondary/10 to-tertiary/10 min-h-screen">
      {/* Header */}
      <div className="relative w-full bg-gradient-to-br from-tertiary via-tertiary to-secondary rounded-3xl p-1 shadow-clay-surface overflow-hidden mb-8">
        <div className="absolute inset-0 rounded-3xl border-4 border-dashed border-surface/40 pointer-events-none"></div>
        <div className="relative bg-surface/95 backdrop-blur-sm rounded-[24px] p-8 md:p-10">
          <div className="relative z-10 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Link
                href={`/tutoring/classes/${id}/assignments/${assignmentId}`}
                className="inline-flex items-center gap-1 text-text-muted hover:text-tertiary font-label-sm font-semibold"
              >
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                Back to Assignment
              </Link>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-4 py-1 rounded-full bg-tertiary text-text-primary font-label-sm text-label-sm tracking-wider uppercase font-bold shadow-clay-surface border-2 border-surface/30">🧠 Quiz Questions</span>
              </div>
              <h1 className="font-headline-xl text-headline-xl text-text-muted tracking-tight leading-none">
                Manage Quiz Questions
              </h1>
              <p className="font-body-lg text-body-lg text-text-muted leading-relaxed">
                {questionsWithOptions.length} questions added
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Add Question Form */}
      <div className="rounded-[24px] bg-surface p-8 shadow-clay-surface border border-surface-border mb-6">
        <h2 className="font-headline-lg text-headline-lg text-text-primary font-bold mb-4">Add New Question</h2>
        <form action={createQuestion} className="space-y-6">
          <input type="hidden" name="quizId" value={quizId} />
          <input type="hidden" name="groupId" value={id} />
          <input type="hidden" name="assignmentId" value={assignmentId} />

          {/* Question Text */}
          <div>
            <label htmlFor="questionText" className="block font-label-md font-semibold text-text-primary mb-2">
              Question *
            </label>
            <textarea
              id="questionText"
              name="questionText"
              required
              rows={3}
              className="w-full rounded-xl border-2 border-surface-border px-4 py-3 font-body-md text-text-primary focus:border-tertiary focus:outline-none shadow-clay-surface-pressed bg-surface transition-all resize-none"
              placeholder="Enter your question..."
            />
          </div>

          {/* Question Type */}
          <div>
            <label htmlFor="questionType" className="block font-label-md font-semibold text-text-primary mb-2">
              Question Type *
            </label>
            <select
              id="questionType"
              name="questionType"
              required
              className="w-full rounded-xl border-2 border-surface-border px-4 py-3 font-body-md text-text-primary focus:border-tertiary focus:outline-none shadow-clay-surface-pressed bg-surface transition-all"
            >
              <option value="multiple_choice">Multiple Choice</option>
              <option value="true_false">True/False</option>
              <option value="short_answer">Short Answer</option>
              <option value="essay">Essay</option>
            </select>
          </div>

          {/* Points */}
          <div>
            <label htmlFor="points" className="block font-label-md font-semibold text-text-primary mb-2">
              Points *
            </label>
            <input
              type="number"
              id="points"
              name="points"
              required
              min="1"
              defaultValue="1"
              className="w-full rounded-xl border-2 border-surface-border px-4 py-3 font-body-md text-text-primary focus:border-tertiary focus:outline-none shadow-clay-surface-pressed bg-surface transition-all"
            />
          </div>

          {/* Options for Multiple Choice */}
          <div id="optionsSection">
            <label className="block font-label-md font-semibold text-text-primary mb-2">
              Options (for Multiple Choice)
            </label>
            <div className="space-y-2">
              {[1, 2, 3, 4].map((num) => (
                <div key={num} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="correctOption"
                    value={num}
                    className="w-5 h-5 text-tertiary focus:ring-tertiary"
                  />
                  <input
                    type="text"
                    name={`option${num}`}
                    className="flex-1 rounded-xl border-2 border-surface-border px-4 py-2 font-body-md text-text-primary focus:border-tertiary focus:outline-none shadow-clay-surface-pressed bg-surface transition-all"
                    placeholder={`Option ${num}`}
                  />
                </div>
              ))}
            </div>
            <p className="font-body-sm text-text-muted mt-1">Select the radio button for the correct answer</p>
          </div>

          {/* Submit Button */}
          <div className="flex items-center gap-4 pt-4 border-t border-surface-border">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-full bg-tertiary text-text-primary px-6 py-3 font-label-md font-bold shadow-clay-primary border-2 border-surface/30 transform hover:scale-105 transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-[20px]">add</span>
              Add Question
            </button>
          </div>
        </form>
      </div>

      {/* Existing Questions */}
      <div className="rounded-[24px] bg-surface p-8 shadow-clay-surface border border-surface-border">
        <h2 className="font-headline-lg text-headline-lg text-text-primary font-bold mb-4">
          Existing Questions ({questionsWithOptions.length})
        </h2>
        {questionsWithOptions.length === 0 ? (
          <p className="font-body-md text-text-muted">No questions added yet.</p>
        ) : (
          <div className="space-y-4">
            {questionsWithOptions.map((question, idx) => (
              <div
                key={question.id}
                className="rounded-xl bg-surface-border p-4 border-2 border-surface/30"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 rounded-full bg-tertiary/10 text-tertiary font-label-sm font-semibold">
                        Q{idx + 1}
                      </span>
                      <span className="px-2 py-1 rounded-full bg-primary/10 text-primary font-label-sm font-semibold">
                        {question.points} pts
                      </span>
                      <span className="px-2 py-1 rounded-full bg-secondary/10 text-secondary font-label-sm font-semibold capitalize">
                        {question.questionType.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="font-body-md text-text-primary mb-2">{question.questionText}</p>
                    {question.options.length > 0 && (
                      <div className="space-y-1 mt-3">
                        {question.options.map((option) => (
                          <div
                            key={option.id}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                              option.isCorrect ? "bg-success/10 text-success" : "bg-surface/50 text-text-muted"
                            }`}
                          >
                            <span className="material-symbols-outlined text-[16px]">
                              {option.isCorrect ? "check_circle" : "radio_button_unchecked"}
                            </span>
                            <span className="font-body-sm">{option.optionText}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <button className="p-2 rounded-full bg-error/10 text-error hover:bg-error/20 transition-all">
                    <span className="material-symbols-outlined text-[20px]">delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Done Button */}
      <div className="mt-6 flex justify-end">
        <Link
          href={`/tutoring/classes/${id}/assignments/${assignmentId}`}
          className="inline-flex items-center gap-2 rounded-full bg-primary text-text-primary px-6 py-3 font-label-md font-bold shadow-clay-primary border-2 border-surface/30 transform hover:scale-105 transition-all active:scale-95"
        >
          <span className="material-symbols-outlined text-[20px]">check</span>
          Done
        </Link>
      </div>
    </div>
  );
}
