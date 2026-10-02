import { createClient } from "@/utils/supabase/server";
import { db } from "@/db";
import { groups, groupMembers, profiles, assignments, groupAnnouncements as groupAnnouncementsTable, submissions } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import Mascot from "@/components/Mascot";

export default async function LearnerGroupDetailPage({ params }: { params: { id: string } }) {
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
    .where(eq(groups.id, params.id))
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
        eq(groupMembers.groupId, params.id),
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
    .where(eq(assignments.groupId, params.id))
    .orderBy(desc(assignments.createdAt));

  // Fetch announcements
  const groupAnnouncementsData = await db
    .select()
    .from(groupAnnouncementsTable)
    .where(eq(groupAnnouncementsTable.groupId, params.id))
    .orderBy(desc(groupAnnouncementsTable.createdAt))
    .limit(5);

  return (
    <div className="w-full px-8 py-8 bg-gradient-to-br from-background via-blue-50 to-cyan-50 min-h-screen">
      {/* Header */}
      <div className="relative w-full bg-gradient-to-br from-blue-500 via-cyan-500 to-teal-500 rounded-3xl p-1 shadow-2xl overflow-hidden mb-8">
        <div className="absolute inset-0 rounded-3xl border-4 border-dashed border-white/40 pointer-events-none"></div>
        <div className="relative bg-white/95 backdrop-blur-sm rounded-2xl p-8 md:p-10">
          <div className="relative z-10 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Link
                href="/classes"
                className="inline-flex items-center gap-1 text-text-muted hover:text-primary font-label-sm font-semibold"
              >
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                Back to Classes
              </Link>
            </div>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex flex-col gap-2">
                <h1 className="font-headline-xl text-headline-xl text-text-primary tracking-tight leading-none">
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
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-surface border-2 border-surface-border">
                    {tutor.avatarUrl ? (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm border-2 border-white/30">
                        {tutor.displayName?.[0] || "?"}
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm border-2 border-white/30">
                        {tutor.displayName?.[0] || "?"}
                      </div>
                    )}
                    <span className="font-label-sm font-semibold text-text-primary">
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
        <button className="px-4 py-2 rounded-full bg-primary text-white font-label-md font-semibold shadow-clay-primary">
          Stream
        </button>
        <button className="px-4 py-2 rounded-full bg-surface text-text-muted font-label-md font-semibold hover:bg-surface-hover transition-all">
          Classwork
        </button>
        <button className="px-4 py-2 rounded-full bg-surface text-text-muted font-label-md font-semibold hover:bg-surface-hover transition-all">
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
                className="rounded-2xl bg-surface p-6 shadow-clay-surface border border-surface-border"
              >
                <h3 className="font-headline-md text-headline-md text-text-primary font-bold mb-2">
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
            <h3 className="font-headline-lg text-headline-lg text-text-primary font-bold mb-4">
              Assignments
            </h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Link
                  href={`/classes/${params.id}/assignments`}
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-6 py-3 font-label-md font-bold shadow-xl border-4 border-white/30 transform hover:scale-105 transition-all active:scale-95"
                >
                  <span className="material-symbols-outlined text-[20px]">assignment</span>
                  Assignments
                </Link>
              </div>
              {groupAssignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="rounded-2xl bg-surface p-6 shadow-clay-surface border border-surface-border"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="font-headline-md text-headline-md text-text-primary font-bold mb-2">
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
                        <p className="font-label-sm font-semibold text-primary">
                          {assignment.points} points
                        </p>
                        {assignment.submissionStatus && (
                          <span className={`px-3 py-1 rounded-full font-label-sm font-semibold ${
                            assignment.submissionStatus === "graded" ? "bg-green-100 text-green-700" :
                            assignment.submissionStatus === "submitted" ? "bg-blue-100 text-blue-700" :
                            "bg-yellow-100 text-yellow-700"
                          }`}>
                            {assignment.submissionStatus}
                          </span>
                        )}
                      </div>
                    </div>
                    {assignment.submissionStatus === "graded" && (
                      <div className="text-right">
                        <p className="font-headline-md text-headline-md text-text-primary font-bold">
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
          <div className="rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 p-12 text-center shadow-xl border-4 border-white/50">
            <div className="relative w-20 h-20 rounded-xl bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center overflow-hidden shadow-xl mx-auto mb-4 border-4 border-white/30">
              <Mascot pose="empty" size={64} />
            </div>
            <p className="font-body-md text-text-muted font-bold">No announcements or assignments yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
