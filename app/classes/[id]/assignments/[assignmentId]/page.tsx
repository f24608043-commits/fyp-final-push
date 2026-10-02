import { createClient } from "@/utils/supabase/server";
import { db } from "@/db";
import { groups, groupMembers, profiles, assignments, submissions } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import Mascot from "@/components/Mascot";
import { submitAssignment } from "./actions";

export default async function AssignmentDetailPage({ params }: { params: { id: string; assignmentId: string } }) {
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
    .where(eq(assignments.id, params.assignmentId))
    .limit(1);

  if (!assignment) {
    notFound();
  }

  // Verify assignment belongs to the group
  if (assignment.groupId !== params.id) {
    redirect(`/classes/${params.id}`);
  }

  // Verify user is a member of this group
  const [member] = await db
    .select()
    .from(groupMembers)
    .where(
      and(
        eq(groupMembers.groupId, params.id),
        eq(groupMembers.userId, user.id)
      )
    )
    .limit(1);

  if (!member) {
    redirect(`/classes/${params.id}`);
  }

  // Fetch existing submission
  const [existingSubmission] = await db
    .select()
    .from(submissions)
    .where(
      and(
        eq(submissions.assignmentId, params.assignmentId),
        eq(submissions.studentId, user.id)
      )
    )
    .limit(1);

  return (
    <div className="w-full px-8 py-8 bg-gradient-to-br from-background via-blue-50 to-cyan-50 min-h-screen">
      {/* Header */}
      <div className="relative w-full bg-gradient-to-br from-blue-500 via-cyan-500 to-teal-500 rounded-3xl p-1 shadow-2xl overflow-hidden mb-8">
        <div className="absolute inset-0 rounded-3xl border-4 border-dashed border-white/40 pointer-events-none"></div>
        <div className="relative bg-white/95 backdrop-blur-sm rounded-2xl p-8 md:p-10">
          <div className="relative z-10 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Link
                href={`/classes/${params.id}`}
                className="inline-flex items-center gap-1 text-text-muted hover:text-primary font-label-sm font-semibold"
              >
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                Back to Class
              </Link>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-4 py-1 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-label-sm text-label-sm tracking-wider uppercase font-bold shadow-lg border-2 border-white/30">📝 Assignment</span>
                <span className={`px-4 py-1 rounded-full font-label-sm font-semibold ${
                  assignment.status === "published" ? "bg-green-100 text-green-700" :
                  "bg-gray-100 text-gray-700"
                }`}>
                  {assignment.status}
                </span>
              </div>
              <h1 className="font-headline-xl text-headline-xl text-text-primary tracking-tight leading-none">
                {assignment.title}
              </h1>
              <div className="flex flex-wrap items-center gap-4">
                {assignment.dueDate && (
                  <p className="font-body-md text-text-muted">
                    Due: {new Date(assignment.dueDate).toLocaleString()}
                  </p>
                )}
                <p className="font-label-md font-semibold text-primary">
                  {assignment.points} points
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Assignment Description */}
      {assignment.description && (
        <div className="rounded-2xl bg-surface p-6 shadow-clay-surface border border-surface-border mb-6">
          <h2 className="font-headline-lg text-headline-lg text-text-primary font-bold mb-4">Instructions</h2>
          <p className="font-body-md text-text-muted whitespace-pre-wrap">
            {assignment.description}
          </p>
        </div>
      )}

      {/* Submission Status */}
      {existingSubmission ? (
        <div className="rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 p-6 shadow-xl border-4 border-green-200 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="material-symbols-outlined text-green-600 text-[32px]" style={{ fontVariationSettings: 'FILL 1' }}>check_circle</span>
            <div>
              <h3 className="font-headline-lg text-headline-lg text-green-700 font-bold">Assignment Submitted</h3>
              <p className="font-body-sm text-green-600">
                Submitted on {new Date(existingSubmission.submittedAt).toLocaleString()}
              </p>
            </div>
          </div>
          {existingSubmission.status === "graded" && (
            <div className="bg-white rounded-xl p-4 border-2 border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-label-md font-semibold text-text-primary">Grade</p>
                  <p className="font-headline-xl text-headline-xl text-green-700 font-bold">
                    {existingSubmission.pointsEarned}/{assignment.points}
                  </p>
                </div>
                {existingSubmission.feedback && (
                  <div className="flex-1 ml-6">
                    <p className="font-label-sm font-semibold text-text-muted mb-1">Feedback</p>
                    <p className="font-body-md text-text-primary">{existingSubmission.feedback}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Submission Form */
        <div className="rounded-2xl bg-surface p-6 shadow-clay-surface border border-surface-border">
          <h2 className="font-headline-lg text-headline-lg text-text-primary font-bold mb-4">Submit Assignment</h2>
          <form action={submitAssignment} className="space-y-6">
            <input type="hidden" name="assignmentId" value={params.assignmentId} />
            <input type="hidden" name="groupId" value={params.id} />

            {/* Text Response */}
            <div>
              <label htmlFor="textResponse" className="block font-label-md font-semibold text-text-primary mb-2">
                Your Response
              </label>
              <textarea
                id="textResponse"
                name="textResponse"
                rows={8}
                className="w-full rounded-xl border-2 border-surface-border px-4 py-3 font-body-md text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                placeholder="Write your response here..."
              />
            </div>

            {/* File Upload (placeholder) */}
            <div>
              <label className="block font-label-md font-semibold text-text-primary mb-2">
                Attachments
              </label>
              <div className="border-2 border-dashed border-surface-border rounded-xl p-8 text-center">
                <span className="material-symbols-outlined text-text-muted text-[48px]">cloud_upload</span>
                <p className="font-body-md text-text-muted mt-2">
                  Drag and drop files here, or click to browse
                </p>
                <p className="font-body-sm text-text-muted mt-1">
                  File upload coming soon
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex items-center gap-4 pt-4 border-t border-surface-border">
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-6 py-3 font-label-md font-bold shadow-clay-primary border-2 border-white/30 transform hover:scale-105 transition-all active:scale-95"
              >
                <span className="material-symbols-outlined text-[20px]">send</span>
                Submit Assignment
              </button>
              <Link
                href={`/classes/${params.id}`}
                className="inline-flex items-center gap-2 rounded-full bg-surface border-2 border-surface-border text-text-primary px-6 py-3 font-label-md font-semibold shadow-clay-surface hover:shadow-clay-primary transition-all"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
