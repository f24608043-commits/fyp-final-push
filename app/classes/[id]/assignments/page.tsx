import { createClient } from "@/utils/supabase/server";
import { db } from "@/db";
import { groups, groupMembers, profiles, assignments, submissions } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function LearnerAssignmentsPage({ params }: PageProps) {
  const { id } = await params;
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

  // Fetch group details
  const [group] = await db
    .select()
    .from(groups)
    .where(eq(groups.id, id))
    .limit(1);

  if (!group) {
    notFound();
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
    redirect("/classes");
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
    .where(eq(assignments.groupId, id))
    .orderBy(desc(assignments.createdAt));

  // Fetch user's submissions for each assignment
  const assignmentsWithSubmissions = await Promise.all(
    assignmentsList.map(async (assignment) => {
      const [submission] = await db
        .select()
        .from(submissions)
        .where(
          and(
            eq(submissions.assignmentId, assignment.id),
            eq(submissions.studentId, user.id)
          )
        )
        .limit(1);

      return {
        ...assignment,
        submission: submission || null,
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
                href={`/classes/${id}`}
                className="inline-flex items-center gap-1 text-text-muted hover:text-primary font-label-sm font-semibold"
              >
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                Back to Class
              </Link>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-4 py-1 rounded-full bg-tertiary text-text-primary font-label-sm text-label-sm tracking-wider uppercase font-bold shadow-clay-surface border-2 border-surface/30">📝 Assignments</span>
              </div>
              <h1 className="font-headline-xl text-headline-xl text-text-primary tracking-tight leading-none">
                {group.name} - Assignments
              </h1>
              <p className="font-body-lg text-body-lg text-text-muted leading-relaxed">
                View and submit your assignments
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Assignments List */}
      {assignmentsWithSubmissions.length === 0 ? (
        <div className="rounded-[24px] bg-surface p-12 text-center shadow-clay-surface border-4 border-surface/50">
          <span className="material-symbols-outlined text-text-primary text-[64px]">assignment</span>
          <h2 className="font-headline-lg text-headline-lg text-text-primary font-bold mt-4 mb-2">No Assignments Yet</h2>
          <p className="font-body-md text-text-muted">
            Your tutor hasn't created any assignments yet
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {assignmentsWithSubmissions.map((assignment) => (
            <Link
              key={assignment.id}
              href={`/classes/${id}/assignments/${assignment.id}`}
              className="block rounded-[24px] bg-surface p-6 shadow-clay-surface border border-surface-border hover:shadow-clay-primary transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-headline-md text-headline-md text-text-primary font-bold">
                      {assignment.title}
                    </h3>
                    {assignment.submission ? (
                      <span className="px-3 py-1 rounded-full bg-primary/10 text-success font-label-sm font-semibold">
                        Submitted
                      </span>
                    ) : assignment.dueDate && new Date(assignment.dueDate) < new Date() ? (
                      <span className="px-3 py-1 rounded-full bg-error/10 text-error font-label-sm font-semibold">
                        Overdue
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full bg-secondary/10 text-secondary font-label-sm font-semibold">
                        Pending
                      </span>
                    )}
                  </div>
                  {assignment.description && (
                    <p className="font-body-sm text-text-muted mb-3 line-clamp-2">
                      {assignment.description}
                    </p>
                  )}
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
                  </div>
                </div>
                <span className="material-symbols-outlined text-text-muted text-[24px]">arrow_forward</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
