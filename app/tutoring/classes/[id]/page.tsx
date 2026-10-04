import { createClient } from "@/utils/supabase/server";
import { db } from "@/db";
import { groups, groupMembers, profiles, assignments, groupAnnouncements as groupAnnouncementsTable } from "@/db/schema";
import { eq, and, count, desc } from "drizzle-orm";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import Mascot from "@/components/Mascot";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function GroupDetailPage({ params }: PageProps) {
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

  // Only tutors can access this page
  if (profile?.role !== "tutor") {
    redirect("/tutoring");
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

  // Verify user is the tutor of this group
  if (group.tutorId !== user.id) {
    redirect("/tutoring/classes");
  }

  // Fetch group members
  const members = await db
    .select({
      id: groupMembers.id,
      userId: groupMembers.userId,
      role: groupMembers.role,
      joinedAt: groupMembers.joinedAt,
      displayName: profiles.displayName,
      avatarUrl: profiles.avatarUrl,
    })
    .from(groupMembers)
    .innerJoin(profiles, eq(groupMembers.userId, profiles.id))
    .where(eq(groupMembers.groupId, id));

  // Fetch assignments
  const groupAssignments = await db
    .select()
    .from(assignments)
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
    <div className="w-full px-8 py-8 bg-gradient-to-br from-background via-tertiary/10 to-tertiary/10 min-h-screen">
      {/* Header with Cover Image */}
      <div className="relative w-full bg-tertiary rounded-3xl p-1 shadow-clay-surface overflow-hidden mb-8">
        <div className="absolute inset-0 rounded-3xl border-4 border-dashed border-surface/40 pointer-events-none"></div>
        <div className="relative bg-surface/95 backdrop-blur-sm rounded-[24px] p-8 md:p-10">
          <div className="relative z-10 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Link
                href="/tutoring/classes"
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
                  <p className="font-body-md text-text-muted">{group.description}</p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <span className="px-3 py-1 rounded-full bg-surface-border font-label-sm font-semibold text-text-muted">
                    {group.privacy === "public" ? "Public" : "Private"}
                  </span>
                  {group.groupCode && (
                    <span className="px-3 py-1 rounded-full bg-primary/10 font-label-sm font-semibold text-primary">
                      Code: {group.groupCode}
                    </span>
                  )}
                  <div className="px-3 py-1 rounded-full bg-surface border-2 border-surface-border font-label-sm font-semibold">
                    {members.length} Students
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href={`/tutoring/classes/${id}/assignments`}
                  className="inline-flex items-center gap-2 rounded-full bg-tertiary text-text-primary px-6 py-3 font-label-md font-bold shadow-clay-surface border-4 border-surface/30 transform hover:scale-105 transition-all active:scale-95"
                >
                  <span className="material-symbols-outlined text-[20px]">assignment</span>
                  Assignments
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex gap-2 mb-6 border-b-2 border-surface-border pb-4">
        <button className="px-4 py-2 rounded-full bg-primary text-text-primary font-label-md font-semibold shadow-clay-primary">
          Stream
        </button>
        <button className="px-4 py-2 rounded-full bg-surface text-text-muted font-label-md font-semibold hover:bg-surface-hover transition-all">
          Classwork
        </button>
        <button className="px-4 py-2 rounded-full bg-surface text-text-muted font-label-md font-semibold hover:bg-surface-hover transition-all">
          People
        </button>
        <button className="px-4 py-2 rounded-full bg-surface text-text-muted font-label-md font-semibold hover:bg-surface-hover transition-all">
          Grades
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

        {/* Create Announcement */}
        <div className="rounded-[24px] bg-surface p-6 shadow-clay-surface border border-surface-border">
          <h3 className="font-headline-md text-headline-md text-text-primary font-bold mb-4">
            Create Announcement
          </h3>
          <form className="space-y-4">
            <input
              type="text"
              placeholder="Announcement title"
              className="w-full rounded-xl border-2 border-surface-border px-4 py-3 font-body-md text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
            <textarea
              placeholder="What's happening in your class?"
              rows={3}
              className="w-full rounded-xl border-2 border-surface-border px-4 py-3 font-body-md text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-full bg-tertiary text-text-primary px-6 py-3 font-label-md font-bold shadow-clay-primary border-2 border-surface/30 transform hover:scale-105 transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-[20px]">send</span>
              Post
            </button>
          </form>
        </div>

        {/* Upcoming Assignments */}
        {groupAssignments.length > 0 && (
          <div>
            <h3 className="font-headline-lg text-headline-lg text-text-primary font-bold mb-4">
              Recent Assignments
            </h3>
            <div className="space-y-4">
              {groupAssignments.slice(0, 3).map((assignment) => (
                <Link
                  key={assignment.id}
                  href={`/tutoring/classes/${id}/assignments/${assignment.id}`}
                  className="block rounded-[24px] bg-surface p-6 shadow-clay-surface border border-surface-border hover:shadow-clay-primary transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="font-headline-md text-headline-md text-text-primary font-bold mb-2">
                        {assignment.title}
                      </h4>
                      {assignment.dueDate && (
                        <p className="font-body-sm text-text-muted">
                          Due: {new Date(assignment.dueDate).toLocaleString()}
                        </p>
                      )}
                      <p className="font-label-sm font-semibold text-primary mt-2">
                        {assignment.points} points
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full font-label-sm font-semibold ${
                      assignment.status === "published" ? "bg-primary/10 text-success" :
                      assignment.status === "draft" ? "surface text-text-muted" :
                      "bg-tertiary/10 text-tertiary"
                    }`}>
                      {assignment.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
