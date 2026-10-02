import { createClient } from "@/utils/supabase/server";
import { db } from "@/db";
import { groups, profiles, assignments } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createQuiz } from "@/app/tutoring/classes/actions";

interface PageProps {
  params: Promise<{ id: string; assignmentId: string }>;
}

export default async function CreateQuizPage({ params }: PageProps) {
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

  // Only tutors can access this page
  if (profile?.role !== "tutor") {
    redirect("/tutoring");
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
    redirect(`/tutoring/classes/${id}`);
  }

  // Verify user is the tutor of this group
  if (assignment.tutorId !== user.id) {
    redirect(`/tutoring/classes/${id}`);
  }

  return (
    <div className="w-full px-8 py-8 bg-gradient-to-br from-slate-50 via-amber-50 to-indigo-50 min-h-screen">
      {/* Header */}
      <div className="relative w-full bg-gradient-to-br from-indigo-500 via-purple-500 to-amber-500 rounded-3xl p-1 shadow-2xl overflow-hidden mb-8">
        <div className="absolute inset-0 rounded-3xl border-4 border-dashed border-white/40 pointer-events-none"></div>
        <div className="relative bg-white/95 backdrop-blur-sm rounded-2xl p-8 md:p-10">
          <div className="relative z-10 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Link
                href={`/tutoring/classes/${id}`}
                className="inline-flex items-center gap-1 text-slate-600 hover:text-indigo-600 font-label-sm font-semibold"
              >
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                Back to Class
              </Link>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-4 py-1 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-label-sm text-label-sm tracking-wider uppercase font-bold shadow-lg border-2 border-white/30">🧠 Create Quiz</span>
              </div>
              <h1 className="font-headline-xl text-headline-xl text-slate-900 tracking-tight leading-none">
                Create Quiz for {assignment.title}
              </h1>
              <p className="font-body-lg text-body-lg text-slate-600 leading-relaxed">
                Add quiz questions to this assignment
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quiz Settings Form */}
      <div className="rounded-2xl bg-white p-8 shadow-clay-surface border border-slate-200 max-w-3xl">
        <form action={createQuiz} className="space-y-6">
          <input type="hidden" name="assignmentId" value={assignmentId} />
          <input type="hidden" name="groupId" value={id} />

          {/* Time Limit */}
          <div>
            <label htmlFor="timeLimit" className="block font-label-md font-semibold text-slate-900 mb-2">
              Time Limit (minutes)
            </label>
            <input
              type="number"
              id="timeLimit"
              name="timeLimit"
              min="1"
              className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 font-body-md text-slate-900 focus:border-indigo-400 focus:outline-none shadow-clay-inset bg-white transition-all"
              placeholder="e.g., 30"
            />
            <p className="font-body-sm text-slate-500 mt-1">Leave empty for no time limit</p>
          </div>

          {/* Max Attempts */}
          <div>
            <label htmlFor="maxAttempts" className="block font-label-md font-semibold text-slate-900 mb-2">
              Maximum Attempts
            </label>
            <input
              type="number"
              id="maxAttempts"
              name="maxAttempts"
              min="1"
              defaultValue="1"
              className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 font-body-md text-slate-900 focus:border-indigo-400 focus:outline-none shadow-clay-inset bg-white transition-all"
              placeholder="1"
            />
          </div>

          {/* Allow Retakes */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="allowRetakes"
              name="allowRetakes"
              className="w-5 h-5 rounded border-2 border-slate-300 text-indigo-500 focus:ring-indigo-500"
            />
            <label htmlFor="allowRetakes" className="font-label-md font-semibold text-slate-900">
              Allow students to retake quiz
            </label>
          </div>

          {/* Randomize Questions */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="randomizeQuestions"
              name="randomizeQuestions"
              className="w-5 h-5 rounded border-2 border-slate-300 text-indigo-500 focus:ring-indigo-500"
            />
            <label htmlFor="randomizeQuestions" className="font-label-md font-semibold text-slate-900">
              Randomize question order
            </label>
          </div>

          {/* Show Results After */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="showResultsAfter"
              name="showResultsAfter"
              defaultChecked
              className="w-5 h-5 rounded border-2 border-slate-300 text-indigo-500 focus:ring-indigo-500"
            />
            <label htmlFor="showResultsAfter" className="font-label-md font-semibold text-slate-900">
              Show results immediately after submission
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-4 pt-4 border-t border-slate-200">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-6 py-3 font-label-md font-bold shadow-clay-primary border-2 border-white/30 transform hover:scale-105 transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-[20px]">add</span>
              Create Quiz & Add Questions
            </button>
            <Link
              href={`/tutoring/classes/${id}`}
              className="inline-flex items-center gap-2 rounded-full bg-white border-2 border-slate-200 text-slate-900 px-6 py-3 font-label-md font-semibold shadow-clay-surface hover:shadow-clay-primary transition-all"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>

      {/* Questions Section - Placeholder for adding questions */}
      <div className="mt-6 rounded-2xl bg-white p-8 shadow-clay-surface border border-slate-200">
        <h2 className="font-headline-lg text-headline-lg text-slate-900 font-bold mb-4">
          Quiz Questions
        </h2>
        <p className="font-body-md text-slate-600">
          After creating the quiz, you'll be able to add questions. Question types include:
        </p>
        <ul className="mt-4 space-y-2 font-body-md text-slate-600">
          <li className="flex items-center gap-2">
            <span className="material-symbols-outlined text-indigo-500">radio_button_checked</span>
            Multiple Choice
          </li>
          <li className="flex items-center gap-2">
            <span className="material-symbols-outlined text-indigo-500">toggle_on</span>
            True/False
          </li>
          <li className="flex items-center gap-2">
            <span className="material-symbols-outlined text-indigo-500">short_text</span>
            Short Answer
          </li>
          <li className="flex items-center gap-2">
            <span className="material-symbols-outlined text-indigo-500">notes</span>
            Essay
          </li>
        </ul>
      </div>
    </div>
  );
}
