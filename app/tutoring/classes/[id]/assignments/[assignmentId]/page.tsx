import { createClient } from "@/utils/supabase/server";
import { db } from "@/db";
import { groups, profiles, assignments, submissions } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";

interface PageProps {
  params: Promise<{ id: string; assignmentId: string }>;
}

export default async function TutorAssignmentDetailPage({ params }: PageProps) {
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
    redirect("/classes");
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

  // Fetch group to verify ownership
  const [group] = await db
    .select()
    .from(groups)
    .where(eq(groups.id, id))
    .limit(1);

  if (!group || group.tutorId !== user.id) {
    redirect("/tutoring/classes");
  }

  // Fetch submissions for this assignment
  const assignmentSubmissions = await db
    .select({
      id: submissions.id,
      submittedAt: submissions.submittedAt,
      feedback: submissions.feedback,
      studentId: submissions.studentId,
      studentName: profiles.displayName,
      studentAvatar: profiles.avatarUrl,
    })
    .from(submissions)
    .innerJoin(profiles, eq(submissions.studentId, profiles.id))
    .where(eq(submissions.assignmentId, assignmentId))
    .orderBy(desc(submissions.submittedAt));

  return (
    <div className="w-full px-8 py-8 bg-gradient-to-br from-background via-blue-50 to-cyan-50 min-h-screen">
      {/* Header */}
      <div className="relative w-full bg-gradient-to-br from-blue-500 via-cyan-500 to-teal-500 rounded-3xl p-1 shadow-2xl overflow-hidden mb-8">
        <div className="absolute inset-0 rounded-3xl border-4 border-dashed border-white/40 pointer-events-none"></div>
        <div className="relative bg-white/95 backdrop-blur-sm rounded-2xl p-8 md:p-10">
          <div className="relative z-10 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Link
                href={`/tutoring/classes/${id}/assignments`}
                className="inline-flex items-center gap-1 text-text-muted hover:text-primary font-label-sm font-semibold"
              >
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                Back to Assignments
              </Link>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-4 py-1 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-label-sm text-label-sm tracking-wider uppercase font-bold shadow-lg border-2 border-white/30">📝 Assignment</span>
              </div>
              <h1 className="font-headline-xl text-headline-xl text-text-primary tracking-tight leading-none">
                {assignment.title}
              </h1>
              <div className="flex flex-wrap items-center gap-4">
                {assignment.dueDate && (
                  <p className="font-body-sm text-text-muted">
                    Due: {new Date(assignment.dueDate).toLocaleString()}
                  </p>
                )}
                {assignment.points && (
                  <p className="font-label-sm font-semibold text-primary">
                    {assignment.points} points
                  </p>
                )}
                <p className="font-body-sm text-text-muted">
                  Created: {new Date(assignment.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Assignment Description */}
      {assignment.description && (
        <div className="rounded-2xl bg-surface p-6 shadow-clay-surface border border-surface-border mb-6">
          <h2 className="font-headline-lg text-headline-lg text-text-primary font-bold mb-4">Description</h2>
          <p className="font-body-md text-text-muted">{assignment.description}</p>
        </div>
      )}

      {/* Submissions */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-headline-lg text-headline-lg text-text-primary font-bold">
            Student Submissions ({assignmentSubmissions.length})
          </h2>
        </div>
        {assignmentSubmissions.length === 0 ? (
          <div className="rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 p-12 text-center shadow-xl border-4 border-white/50">
            <span className="material-symbols-outlined text-gray-400 text-[64px]">assignment</span>
            <h2 className="font-headline-lg text-headline-lg text-text-primary font-bold mt-4 mb-2">No Submissions Yet</h2>
            <p className="font-body-md text-text-muted">
              Students haven't submitted this assignment yet
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {assignmentSubmissions.map((submission) => (
              <div
                key={submission.id}
                className="rounded-2xl bg-surface p-6 shadow-clay-surface border border-surface-border"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xl">
                      {submission.studentName?.[0] || "?"}
                    </div>
                    <div>
                      <p className="font-label-md text-text-primary font-semibold">
                        {submission.studentName || "Unknown Student"}
                      </p>
                      <p className="font-body-sm text-text-muted">
                        Submitted {new Date(submission.submittedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="rounded-full bg-primary/10 text-primary px-4 py-2 font-label-sm font-semibold hover:bg-primary/20 transition-all">
                      Grade
                    </button>
                  </div>
                </div>
                {submission.feedback && (
                  <div className="mt-4 p-4 rounded-xl bg-surface-container">
                    <p className="font-body-sm text-text-muted">{submission.feedback}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
