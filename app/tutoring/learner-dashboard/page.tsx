import { createClient } from "@/utils/supabase/server";
import { db } from "@/db";
import {
  tutorEnrollments,
  profiles,
  tutorProfiles,
  tutorGroupMembers,
  tutorGroups,
  tasks,
  learnerStats,
  userBadges,
  badges,
} from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import UserAvatar from "@/components/UserAvatar";

export default async function LearnerDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  // Get learner's enrollments
  const enrollments = await db
    .select({
      id: tutorEnrollments.id,
      status: tutorEnrollments.status,
      createdAt: tutorEnrollments.createdAt,
      tutor: {
        id: profiles.id,
        displayName: profiles.displayName,
        avatarUrl: profiles.avatarUrl,
      },
      tutorProfile: {
        bio: tutorProfiles.bio,
        subjects: tutorProfiles.subjects,
        hourlyRate: tutorProfiles.hourlyRate,
        rating: tutorProfiles.rating,
      },
    })
    .from(tutorEnrollments)
    .innerJoin(profiles, eq(tutorEnrollments.tutorId, profiles.id))
    .leftJoin(tutorProfiles, eq(tutorEnrollments.tutorId, tutorProfiles.tutorId))
    .where(eq(tutorEnrollments.learnerId, user.id))
    .orderBy(desc(tutorEnrollments.createdAt))
    .limit(50);

  // Get learner's groups
  let groups: any[] = [];
  try {
    groups = await db
      .select({
        id: tutorGroups.id,
        name: tutorGroups.name,
        description: tutorGroups.description,
        subject: tutorGroups.subject,
        level: tutorGroups.level,
        createdAt: tutorGroups.createdAt,
        tutor: {
          id: profiles.id,
          displayName: profiles.displayName,
          avatarUrl: profiles.avatarUrl,
        },
      })
      .from(tutorGroupMembers)
      .innerJoin(tutorGroups, eq(tutorGroupMembers.groupId, tutorGroups.id))
      .innerJoin(profiles, eq(tutorGroups.tutorId, profiles.id))
      .where(eq(tutorGroupMembers.learnerId, user.id))
      .orderBy(desc(tutorGroupMembers.enrolledAt))
      .limit(50);
  } catch (error) {
    console.error("Error fetching learner groups:", error);
    groups = [];
  }

  // Get learner's tasks
  const tasksList = await db
    .select({
      id: tasks.id,
      title: tasks.title,
      description: tasks.description,
      dueDate: tasks.dueDate,
      status: tasks.status,
      targetType: tasks.targetType,
      createdAt: tasks.createdAt,
      tutor: {
        id: profiles.id,
        displayName: profiles.displayName,
        avatarUrl: profiles.avatarUrl,
      },
    })
    .from(tasks)
    .innerJoin(profiles, eq(tasks.tutorId, profiles.id))
    .where(and(
      eq(tasks.targetType, "learner"),
      eq(tasks.targetId, user.id)
    ))
    .orderBy(desc(tasks.createdAt))
    .limit(50);

  // Get learner's stats
  const [stats] = await db
    .select()
    .from(learnerStats)
    .where(eq(learnerStats.learnerId, user.id))
    .limit(1);

  // Get learner's badges
  const learnerBadges = await db
    .select({
      id: userBadges.id,
      awardedAt: userBadges.awardedAt,
      badge: {
        id: badges.id,
        name: badges.name,
        description: badges.description,
        iconUrl: badges.iconUrl,
        category: badges.category,
      },
    })
    .from(userBadges)
    .innerJoin(badges, eq(userBadges.badgeId, badges.id))
    .where(eq(userBadges.userId, user.id))
    .orderBy(desc(userBadges.awardedAt))
    .limit(50);

  const acceptedEnrollments = enrollments.filter((e) => e.status === "accepted");
  const pendingEnrollments = enrollments.filter((e) => e.status === "pending");

  return (
    <div className="w-full px-8 py-8 bg-gradient-to-br from-background via-blue-50 to-cyan-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-headline-2xl text-headline-2xl text-text-primary tracking-tight mb-3">
          Learner Dashboard
        </h1>
        <p className="font-body-lg text-body-lg text-text-muted">
          Manage your enrollments, groups, and tasks
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="rounded-2xl bg-white p-6 shadow-xl border-4 border-blue-100 text-center">
          <div className="text-4xl font-headline-xl text-text-primary font-extrabold mb-2">
            {acceptedEnrollments.length}
          </div>
          <div className="font-label-md text-text-muted">Active Tutors</div>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-xl border-4 border-green-100 text-center">
          <div className="text-4xl font-headline-xl text-text-primary font-extrabold mb-2">
            {groups.length}
          </div>
          <div className="font-label-md text-text-muted">Classrooms</div>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-xl border-4 border-purple-100 text-center">
          <div className="text-4xl font-headline-xl text-text-primary font-extrabold mb-2">
            {tasksList.filter((t) => t.status !== "graded").length}
          </div>
          <div className="font-label-md text-text-muted">Pending Tasks</div>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-xl border-4 border-orange-100 text-center">
          <div className="text-4xl font-headline-xl text-text-primary font-extrabold mb-2">
            {learnerBadges.length}
          </div>
          <div className="font-label-md text-text-muted">Badges Earned</div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* My Tutors */}
        <div className="rounded-2xl bg-white p-8 shadow-xl border-4 border-gray-100">
          <h2 className="font-headline-lg text-headline-lg text-text-primary font-extrabold mb-6">
            My Tutors ({acceptedEnrollments.length})
          </h2>
          {acceptedEnrollments.length === 0 ? (
            <p className="font-body-md text-text-muted">
              No active enrollments. Browse tutors to get started.
            </p>
          ) : (
            <div className="space-y-4">
              {acceptedEnrollments.map((enrollment) => (
                <Link
                  key={enrollment.id}
                  href={`/tutoring/${enrollment.tutor.id}`}
                  className="block p-5 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 hover:border-blue-300 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <UserAvatar
                      avatarUrl={enrollment.tutor.avatarUrl}
                      displayName={enrollment.tutor.displayName}
                      size="md"
                    />
                    <div className="flex-1">
                      <p className="font-label-md text-text-primary font-semibold">
                        {enrollment.tutor.displayName}
                      </p>
                      {enrollment.tutorProfile?.subjects && (
                        <p className="font-body-sm text-text-muted">
                          {enrollment.tutorProfile.subjects.slice(0, 2).join(", ")}
                        </p>
                      )}
                    </div>
                    <span className="material-symbols-outlined text-gray-400">arrow_forward</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
          {pendingEnrollments.length > 0 && (
            <div className="mt-8 pt-8 border-t-2 border-gray-200">
              <h3 className="font-label-lg text-text-primary font-semibold mb-6">
                Pending Requests ({pendingEnrollments.length})
              </h3>
              <div className="space-y-4">
                {pendingEnrollments.map((enrollment) => (
                  <div
                    key={enrollment.id}
                    className="p-6 rounded-xl bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200"
                  >
                    <div className="flex items-center gap-4">
                      <UserAvatar
                        avatarUrl={enrollment.tutor.avatarUrl}
                        displayName={enrollment.tutor.displayName}
                        size="md"
                      />
                      <div className="flex-1">
                        <p className="font-label-md text-text-primary font-semibold">
                          {enrollment.tutor.displayName}
                        </p>
                        <p className="font-body-sm text-text-muted">Pending approval</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <Link
            href="/tutoring"
            className="mt-8 inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-label-lg font-semibold text-lg"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            Find More Tutors
          </Link>
        </div>

        {/* My Classrooms */}
        <div className="rounded-2xl bg-white p-8 shadow-xl border-4 border-gray-100">
          <h2 className="font-headline-lg text-headline-lg text-text-primary font-extrabold mb-6">
            My Classrooms ({groups.length})
          </h2>
          {groups.length === 0 ? (
            <p className="font-body-md text-text-muted">
              You're not in any classrooms yet.
            </p>
          ) : (
            <div className="space-y-4">
              {groups.map((group) => (
                <div
                  key={group.id}
                  className="p-6 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-100"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <p className="font-label-md text-text-primary font-semibold mb-1">
                        {group.name}
                      </p>
                      {group.description && (
                        <p className="font-body-sm text-text-muted mb-2 line-clamp-2">
                          {group.description}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-2 text-sm">
                        {group.subject && (
                          <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 font-label-sm font-semibold">
                            {group.subject}
                          </span>
                        )}
                        {group.level && (
                          <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 font-label-sm font-semibold">
                            {group.level}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* My Tasks */}
        <div className="rounded-2xl bg-white p-8 shadow-xl border-4 border-gray-100 lg:col-span-2">
          <h2 className="font-headline-lg text-headline-lg text-text-primary font-extrabold mb-6">
            My Tasks ({tasksList.length})
          </h2>
          {tasksList.length === 0 ? (
            <p className="font-body-md text-text-muted">
              No tasks assigned yet.
            </p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {tasksList.map((task) => (
                <div
                  key={task.id}
                  className={`p-6 rounded-xl border-2 ${
                    task.status === "graded"
                      ? "bg-gradient-to-br from-green-50 to-emerald-50 border-green-200"
                      : task.status === "submitted"
                      ? "bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200"
                      : "bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <UserAvatar
                      avatarUrl={task.tutor.avatarUrl}
                      displayName={task.tutor.displayName}
                      size="sm"
                    />
                    <span className={`text-xs px-2 py-1 rounded-full font-label-sm font-semibold ${
                      task.status === "graded"
                        ? "bg-green-100 text-green-700"
                        : task.status === "submitted"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-blue-100 text-blue-700"
                    }`}>
                      {task.status}
                    </span>
                  </div>
                  <p className="font-label-md text-text-primary font-semibold mb-2">
                    {task.title}
                  </p>
                  {task.description && (
                    <p className="font-body-md text-text-muted line-clamp-2 mb-3">
                      {task.description}
                    </p>
                  )}
                  {task.dueDate && (
                    <p className="font-body-md text-text-muted">
                      Due: {new Date(task.dueDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* My Badges */}
        {learnerBadges.length > 0 && (
          <div className="rounded-2xl bg-white p-8 shadow-xl border-4 border-gray-100 lg:col-span-2">
            <h2 className="font-headline-lg text-headline-lg text-text-primary font-extrabold mb-6">
              My Badges ({learnerBadges.length})
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {learnerBadges.map((userBadge) => (
                <div
                  key={userBadge.id}
                  className="p-6 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-100 text-center"
                >
                  <div className="text-5xl mb-3">
                    {userBadge.badge.iconUrl ? (
                      <Image src={userBadge.badge.iconUrl} alt={userBadge.badge.name} width={64} height={64} className="w-16 h-16 mx-auto" />
                    ) : (
                      "🏆"
                    )}
                  </div>
                  <p className="font-label-md text-text-primary font-semibold mb-2">
                    {userBadge.badge.name}
                  </p>
                  <p className="font-body-md text-text-muted line-clamp-2">
                    {userBadge.badge.description}
                  </p>
                  <p className="font-body-sm text-text-muted mt-3">
                    Earned {new Date(userBadge.awardedAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
