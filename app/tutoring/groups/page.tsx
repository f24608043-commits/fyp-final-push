import { createClient } from "@/utils/supabase/server";
import { db } from "@/db";
import {
  tutorGroups,
  tutorGroupMembers,
  profiles,
  tutorEnrollments,
  tutorGroupSessions,
} from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";
import UserAvatar from "@/components/UserAvatar";

export default async function TutorGroupsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  // Get tutor's groups with member counts
  const groups = await db
    .select({
      id: tutorGroups.id,
      name: tutorGroups.name,
      description: tutorGroups.description,
      isActive: tutorGroups.isActive,
      createdAt: tutorGroups.createdAt,
    })
    .from(tutorGroups)
    .where(eq(tutorGroups.tutorId, user.id))
    .orderBy(tutorGroups.createdAt);

  // Get member counts for each group
  const groupIds = groups.map((g) => g.id);
  const memberCounts = await db
    .select({
      groupId: tutorGroupMembers.groupId,
      count: tutorGroupMembers.learnerId,
    })
    .from(tutorGroupMembers)
    .where(inArray(tutorGroupMembers.groupId, groupIds));

  // Get enrolled learners for group creation
  const enrolledLearners = await db
    .select({
      id: tutorEnrollments.id,
      learnerId: tutorEnrollments.learnerId,
      learner: {
        id: profiles.id,
        displayName: profiles.displayName,
        avatarUrl: profiles.avatarUrl,
      },
    })
    .from(tutorEnrollments)
    .innerJoin(profiles, eq(tutorEnrollments.learnerId, profiles.id))
    .where(and(eq(tutorEnrollments.tutorId, user.id), eq(tutorEnrollments.status, "accepted")));

  const groupsWithCounts = groups.map((group) => ({
    ...group,
    memberCount: memberCounts.filter((m) => m.groupId === group.id).length,
  }));

  return (
    <div className="w-full px-8 py-8 bg-gradient-to-br from-surface via-secondary/10 to-tertiary/10 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/tutoring/dashboard"
          className="inline-flex items-center gap-2 font-label-lg text-label-lg text-text-muted hover:text-secondary transition-colors group mb-4"
        >
          <span className="material-symbols-outlined text-[20px] transition-transform group-hover:-translate-x-1">arrow_back</span>
          <span>Back to Dashboard</span>
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-headline-2xl text-headline-2xl text-text-muted tracking-tight">
              My Groups
            </h1>
            <p className="font-body-lg text-body-lg text-text-muted">
              Organize your enrolled learners into groups for group sessions
            </p>
          </div>
          <Link
            href="/tutoring/groups/create"
            className="inline-flex items-center gap-2 rounded-full bg-secondary text-text-primary px-6 py-3 font-label-lg font-bold uppercase tracking-wider shadow-clay-primary border-2 border-surface/30 transform hover:scale-105 transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            Create Group
          </Link>
        </div>
      </div>

      {/* Groups List */}
      {groupsWithCounts.length === 0 ? (
        <div className="rounded-[24px] bg-surface p-10 text-center shadow-clay-surface border border-surface-border">
          <div className="relative w-20 h-20 rounded-xl bg-surface-border flex items-center justify-center overflow-hidden shadow-clay-primary mx-auto mb-4 border-2 border-surface/30">
            <span className="material-symbols-outlined text-text-muted text-[40px]">groups</span>
          </div>
          <p className="font-body-lg text-text-muted font-bold mb-4">No groups created yet.</p>
          <p className="font-body-md text-text-muted">
            Create your first group to organize your enrolled learners for group sessions.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {groupsWithCounts.map((group) => (
            <div
              key={group.id}
              className="rounded-[24px] bg-gradient-to-br from-surface to-tertiary/10 p-6 shadow-clay-surface border border-tertiary/30 hover:shadow-clay-primary hover:border-tertiary transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-label-lg text-tertiary font-semibold mb-2">
                    {group.name}
                  </h3>
                  {group.description && (
                    <p className="font-body-md text-tertiary line-clamp-2">
                      {group.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/10 text-secondary font-label-md font-semibold shadow-clay-secondary">
                  <span className="material-symbols-outlined text-[18px]">people</span>
                  {group.memberCount}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-body-md text-text-muted">
                  Created {new Date(group.createdAt).toLocaleDateString()}
                </span>
                <div className="flex gap-2">
                  <Link
                    href={`/tutoring/groups/${group.id}`}
                    className="rounded-full border-2 border-tertiary bg-tertiary/10 text-tertiary px-4 py-2 font-label-md font-bold shadow-clay-secondary hover:from-tertiary/10 hover:to-tertiary/10 transition-all"
                  >
                    Manage
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Available Learners for Group Creation */}
      {enrolledLearners.length > 0 && (
        <div className="mt-8">
          <h2 className="font-headline-lg text-headline-lg text-text-muted font-extrabold mb-6">
            Enrolled Learners ({enrolledLearners.length})
          </h2>
          <div className="rounded-[24px] bg-surface p-6 shadow-clay-surface border border-surface-border">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {enrolledLearners.map((enrollment) => (
                <div
                  key={enrollment.id}
                  className="flex items-center gap-4 p-4 rounded-xl bg-surface border-2 border-surface-border shadow-clay-secondary"
                >
                  <UserAvatar
                    avatarUrl={enrollment.learner.avatarUrl}
                    displayName={enrollment.learner.displayName}
                    size="md"
                  />
                  <span className="font-label-md text-text-muted font-semibold">
                    {enrollment.learner.displayName || "Unknown"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
