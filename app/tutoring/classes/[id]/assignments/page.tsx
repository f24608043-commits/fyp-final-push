import { createClient } from "@/utils/supabase/server";
import { db } from "@/db";
import { groups, groupMembers, profiles, assignments, submissions } from "@/db/schema";
import { eq, and, count, desc } from "drizzle-orm";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";

export default async function TutorAssignmentsPage({ params }: { params: { id: string } }) {
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

  // Fetch group details
  const [group] = await db
    .select()
    .from(groups)
    .where(eq(groups.id, params.id))
    .limit(1);

  if (!group) {
    notFound();
  }

  // Verify user is the tutor of this group
  if (group.tutorId !== user.id) {
    redirect("/tutoring/classes");
  }

  // Fetch assignments for this group
  const assignmentsList = await db
    .select({
      id: assignments.id,
      title: assignments.title,
      description: assignments.description,
      dueDate: assignments.dueDate,
      points: assignments.points,
      createdAt: assignments.createdAt,
    })
    .from(assignments)
    .where(eq(assignments.groupId, params.id))
    .orderBy(desc(assignments.createdAt));

  // Fetch submission counts for each assignment
  const assignmentsWithCounts = await Promise.all(
    assignmentsList.map(async (assignment) => {
      const [submissionCount] = await db
        .select({ count: count() })
        .from(submissions)
        .where(eq(submissions.assignmentId, assignment.id));

      return {
        ...assignment,
        submissionCount: submissionCount?.count || 0,
      };
    })
  );

  return (
    <div className="w-full px-8 py-8 bg-gradient-to-br from-background via-blue-50 to-cyan-50 min-h-screen">
      {/* Header */}
      <div className="relative w-full bg-gradient-to-br from-blue-500 via-cyan-500 to-teal-500 rounded-3xl p-1 shadow-2xl overflow-hidden mb-8">
        <div className="absolute inset-0 rounded-3xl border-4 border-dashed border-white/40 pointer-events-none"></div>
        <div className="relative bg-white/95 backdrop-blur-sm rounded-2xl p-8 md:p-10">
          <div className="relative z-10 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Link
                href={`/tutoring/classes/${params.id}`}
                className="inline-flex items-center gap-1 text-text-muted hover:text-primary font-label-sm font-semibold"
              >
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                Back to Class
              </Link>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-4 py-1 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-label-sm text-label-sm tracking-wider uppercase font-bold shadow-lg border-2 border-white/30">📝 Assignments</span>
              </div>
              <h1 className="font-headline-xl text-headline-xl text-text-primary tracking-tight leading-none">
                {group.name} - Assignments
              </h1>
              <p className="font-body-lg text-body-lg text-text-muted leading-relaxed">
                Manage assignments and view student submissions
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Create Assignment Button */}
      <div className="mb-6">
        <Link
          href={`/tutoring/classes/${params.id}/assignments/create`}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-6 py-3 font-label-md font-bold shadow-xl border-4 border-white/30 transform hover:scale-105 transition-all active:scale-95"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          Create Assignment
        </Link>
      </div>

      {/* Assignments List */}
      {assignmentsWithCounts.length === 0 ? (
        <div className="rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 p-12 text-center shadow-xl border-4 border-white/50">
          <span className="material-symbols-outlined text-gray-400 text-[64px]">assignment</span>
          <h2 className="font-headline-lg text-headline-lg text-text-primary font-bold mt-4 mb-2">No Assignments Yet</h2>
          <p className="font-body-md text-text-muted mb-6">
            Create your first assignment to get started
          </p>
          <Link
            href={`/tutoring/classes/${params.id}/assignments/create`}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-6 py-3 font-label-md font-bold shadow-xl border-4 border-white/30 transform hover:scale-105 transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            Create Assignment
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {assignmentsWithCounts.map((assignment) => (
            <Link
              key={assignment.id}
              href={`/tutoring/classes/${params.id}/assignments/${assignment.id}`}
              className="block rounded-2xl bg-surface p-6 shadow-clay-surface border border-surface-border hover:shadow-clay-primary transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-headline-md text-headline-md text-text-primary font-bold mb-2">
                    {assignment.title}
                  </h3>
                  {assignment.description && (
                    <p className="font-body-sm text-text-muted mb-3 line-clamp-2">
                      {assignment.description}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-4">
                    {assignment.dueDate && (
                      <p className="font-body-sm text-text-muted">
                        Due: {new Date(assignment.dueDate).toLocaleDateString()}
                      </p>
                    )}
                    {assignment.points && (
                      <p className="font-label-sm font-semibold text-primary">
                        {assignment.points} points
                      </p>
                    )}
                    <p className="font-body-sm text-text-muted">
                      Created: {new Date(assignment.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container">
                    <span className="material-symbols-outlined text-[18px] text-primary">description</span>
                    <span className="font-label-sm font-semibold text-text-primary">
                      {assignment.submissionCount} submissions
                    </span>
                  </div>
                  <span className="material-symbols-outlined text-text-muted text-[24px]">arrow_forward</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
