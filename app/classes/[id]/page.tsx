import { createClient } from "@/utils/supabase/server";
import { db } from "@/db";
import { groups, groupMembers, profiles, assignments, groupAnnouncements as groupAnnouncementsTable, submissions } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import Mascot from "@/components/Mascot";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function LearnerGroupDetailPage({ params }: PageProps) {
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

  // Fetch tutor info
  const [tutor] = await db
    .select({
      id: profiles.id,
      displayName: profiles.displayName,
      avatarUrl: profiles.avatarUrl,
    })
    .from(profiles)
    .where(eq(profiles.id, group.tutorId))
    .limit(1);

  // Fetch assignments with submission status
  const groupAssignments = await db
    .select({
      id: assignments.id,
      title: assignments.title,
      description: assignments.description,
      dueDate: assignments.dueDate,
      points: assignments.points,
      status: assignments.status,
      createdAt: assignments.createdAt,
      submissionId: submissions.id,
      submissionStatus: submissions.status,
      submissionPointsEarned: submissions.pointsEarned,
    })
    .from(assignments)
    .leftJoin(
      submissions,
      and(
        eq(submissions.assignmentId, assignments.id),
        eq(submissions.studentId, user.id)
      )
    )
    .where(eq(assignments.groupId, id))
    .orderBy(desc(assignments.createdAt));

  // Fetch announcements
  const groupAnnouncementsData = await db
    .select()
    .from(groupAnnouncementsTable)
    .where(eq(groupAnnouncementsTable.groupId, id))
    .orderBy(desc(groupAnnouncementsTable.createdAt))
    .limit(5);

  return (
    <div className="w-full px-8 py-8 bg-gradient-to-br from-primary/10 via-tertiary/10 to-tertiary/10 min-h-screen">
      {/* Header */}
      <div className="relative w-full bg-gradient-to-br from-primary via-tertiary to-tertiary rounded-3xl p-1 shadow-clay-surface overflow-hidden mb-8">
        <div className="absolute inset-0 rounded-3xl border-4 border-dashed border-surface/40 pointer-events-none"></div>
        <div className="relative bg-surface/95 backdrop-blur-sm rounded-[24px] p-8 md:p-10">
          <div className="relative z-10 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Link
                href="/classes"
                className="inline-flex items-center gap-1 text-text-muted hover:text-success font-label-sm font-semibold"
              >
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                Back to Classes
              </Link>
            </div>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex flex-col gap-2">
                <h1 className="font-headline-xl text-headline-xl text-text-muted tracking-tight leading-none">
                  {group.name}
                </h1>
                {group.subject && (
                  <p className="font-body-lg text-body-lg text-text-muted">
                    {group.subject} {group.gradeLevel && `• ${group.gradeLevel}`}
                  </p>
                )}
                {group.description && (
                  <p className="font-body-md text-text-muted max-w-2xl">
                    {group.description}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3">
                {tutor && (
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-surface border-2 border-surface-border shadow-clay-secondary">
                    {tutor.avatarUrl ? (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-tertiary flex items-center justify-center text-text-primary font-bold text-sm border-2 border-surface/30 shadow-clay-primary">
                        {tutor.displayName?.[0] || "?"}
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-tertiary flex items-center justify-center text-text-primary font-bold text-sm border-2 border-surface/30 shadow-clay-primary">
                        {tutor.displayName?.[0] || "?"}
                      </div>
                    )}
                    <span className="font-label-sm font-semibold text-text-muted">
                      {tutor.displayName || "Tutor"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex gap-2 mb-6 border-b-2 border-surface-border pb-4">
        <button className="px-4 py-2 rounded-full bg-gradient-to-r from-primary to-tertiary text-text-primary font-label-md font-semibold shadow-clay-primary border-2 border-surface/30">
          Stream
        </button>
        <button className="px-4 py-2 rounded-full bg-surface text-text-muted font-label-md font-semibold hover:bg-surface transition-all border-2 border-surface-border">
          Classwork
        </button>
        <button className="px-4 py-2 rounded-full bg-surface text-text-muted font-label-md font-semibold hover:bg-surface transition-all border-2 border-surface-border">
          People
        </button>
      </div>

      {/* Stream Tab Content */}
      <div className="space-y-6">
        {/* Announcements */}
        {groupAnnouncementsData.length > 0 && (
          <div className="space-y-4">
            {groupAnnouncementsData.map((announcement) => (
              <div
                key={announcement.id}
                className="rounded-[24px] bg-surface p-6 shadow-clay-surface border border-surface-border"
              >
                <h3 className="font-headline-md text-headline-md text-text-muted font-bold mb-2">
                  {announcement.title}
                </h3>
                <p className="font-body-md text-text-muted mb-3">
                  {announcement.content}
                </p>
                <p className="font-body-sm text-text-muted">
                  {new Date(announcement.createdAt).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Assignments */}
        {groupAssignments.length > 0 && (
          <div>
            <h3 className="font-headline-lg text-headline-lg text-text-muted font-bold mb-4">
              Assignments
            </h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Link
                  href={`/classes/${id}/assignments`}
                  className="inline-flex items-center gap-2 rounded-full bg-tertiary text-text-primary px-6 py-3 font-label-md font-bold shadow-clay-primary border-2 border-surface/30 transform hover:scale-105 transition-all active:scale-95"
                >
                  <span className="material-symbols-outlined text-[20px]">assignment</span>
                  Assignments
                </Link>
              </div>
              {groupAssignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="rounded-[24px] bg-surface p-6 shadow-clay-surface border border-surface-border"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="font-headline-md text-headline-md text-text-muted font-bold mb-2">
                        {assignment.title}
                      </h4>
                      {assignment.description && (
                        <p className="font-body-sm text-text-muted mb-3 line-clamp-2">
                          {assignment.description}
                        </p>
                      )}
                      {assignment.dueDate && (
                        <p className="font-body-sm text-text-muted mb-2">
                          Due: {new Date(assignment.dueDate).toLocaleString()}
                        </p>
                      )}
                      <div className="flex items-center gap-4">
                        <p className="font-label-sm font-semibold text-success">
                          {assignment.points} points
                        </p>
                        {assignment.submissionStatus && (
                          <span className={`px-3 py-1 rounded-full font-label-sm font-semibold border-2 ${
                            assignment.submissionStatus === "graded" ? "bg-gradient-to-r from-success to-primary text-text-primary border-surface/30" :
                            assignment.submissionStatus === "submitted" ? "bg-tertiary text-text-primary border-surface/30" :
                            "bg-secondary text-text-primary border-surface/30"
                          }`}>
                            {assignment.submissionStatus}
                          </span>
                        )}
                      </div>
                    </div>
                    {assignment.submissionStatus === "graded" && (
                      <div className="text-right">
                        <p className="font-headline-md text-headline-md text-text-muted font-bold">
                          {assignment.submissionPointsEarned}/{assignment.points}
                        </p>
                        <p className="font-body-sm text-text-muted">points earned</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {groupAnnouncementsData.length === 0 && groupAssignments.length === 0 && (
          <div className="rounded-[24px] bg-surface p-12 text-center shadow-clay-surface border border-surface-border">
            <div className="relative w-20 h-20 rounded-xl bg-surface-border flex items-center justify-center overflow-hidden shadow-clay-primary mx-auto mb-4 border-2 border-surface/30">
              <span className="material-symbols-outlined text-text-muted text-[40px]">campaign</span>
            </div>
            <p className="font-body-md text-text-muted font-bold">No announcements or assignments yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
