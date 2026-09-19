import { db } from "@/db";
import { courses, units, lessons, profiles, tutorProfiles, tutorSessions, badges } from "@/db/schema";
import { count, eq, desc, and } from "drizzle-orm";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Mascot from "@/components/Mascot";

export default async function AdminDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect("/sign-in");
  }

  // Check if user has admin role
  const [userProfile] = await db
    .select({ role: profiles.role })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);

  if (!userProfile || userProfile.role !== 'admin') {
    redirect("/path");
  }

  // Optimize: Only fetch stats, defer course list to separate component if needed
  const [totalUsers, totalTutors, totalSessions, totalBadges, allCourses] = await Promise.all([
    db.select({ count: count() }).from(profiles),
    db.select({ count: count() }).from(tutorProfiles),
    db.select({ count: count() }).from(tutorSessions),
    db.select({ count: count() }).from(badges),
    db
      .select({
        id: courses.id,
        title: courses.title,
        isPublished: courses.isPublished,
      })
      .from(courses)
      .orderBy(courses.createdAt)
      .limit(10), // Limit to 10 courses for dashboard
  ]);

  const userCount = totalUsers[0]?.count || 0;
  const tutorCount = totalTutors[0]?.count || 0;
  const sessionCount = totalSessions[0]?.count || 0;
  const badgeCount = totalBadges[0]?.count || 0;

  return (
    <div className="w-full px-6 py-6">
      {/* Header with Mascot */}
      <div className="relative w-full rounded-3xl bg-surface p-6 md:p-8 shadow-clay-surface overflow-hidden mb-6 border border-surface-border">
        <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-primary/10 blur-3xl pointer-events-none"></div>
        <div className="absolute -left-20 -bottom-20 w-72 h-72 rounded-full bg-secondary/10 blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex flex-col gap-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-0.5 rounded-lg bg-surface-border text-text-muted font-label-sm text-label-sm tracking-wider uppercase">Admin Panel</span>
              <span className="text-text-muted text-label-sm">•</span>
              <span className="px-3 py-0.5 rounded-lg bg-error/10 text-error font-label-sm text-label-sm">Full Control</span>
            </div>
            <h1 className="font-headline-xl text-headline-xl text-text-primary tracking-tight leading-none">
              Admin Dashboard
            </h1>
            <p className="font-body-lg text-body-lg text-text-muted leading-relaxed">
              Complete control over users, courses, badges, and tutoring
            </p>
          </div>

          <div className="w-full lg:w-auto flex flex-col sm:flex-row items-center lg:items-end justify-center gap-4 shrink-0 self-center lg:self-auto">
            <div className="relative w-28 h-28 md:w-32 md:h-32 shrink-0">
              <Mascot pose="idle" size={128} />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Link href="/admin/users" className="rounded-2xl bg-surface p-5 shadow-clay-surface border border-surface-border hover:shadow-clay-primary transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="material-symbols-outlined text-tertiary text-[24px]" style={{ fontVariationSettings: 'FILL 1' }}>people</span>
            <span className="font-headline-xl text-headline-xl text-tertiary font-extrabold">{userCount}</span>
          </div>
          <p className="font-label-md text-text-primary font-semibold">Total Users</p>
          <p className="font-body-sm text-text-muted">Manage all users</p>
        </Link>

        <Link href="/admin/courses" className="rounded-2xl bg-surface p-5 shadow-clay-surface border border-surface-border hover:shadow-clay-primary transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="material-symbols-outlined text-primary text-[24px]" style={{ fontVariationSettings: 'FILL 1' }}>school</span>
            <span className="font-headline-xl text-headline-xl text-primary font-extrabold">{allCourses.length}</span>
          </div>
          <p className="font-label-md text-text-primary font-semibold">Total Courses</p>
          <p className="font-body-sm text-text-muted">Manage course content</p>
        </Link>

        <Link href="/admin/tutoring" className="rounded-2xl bg-surface p-5 shadow-clay-surface border border-surface-border hover:shadow-clay-primary transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="material-symbols-outlined text-secondary text-[24px]" style={{ fontVariationSettings: 'FILL 1' }}>groups</span>
            <span className="font-headline-xl text-headline-xl text-secondary font-extrabold">{sessionCount}</span>
          </div>
          <p className="font-label-md text-text-primary font-semibold">Total Sessions</p>
          <p className="font-body-sm text-text-muted">Tutoring oversight</p>
        </Link>

        <Link href="/admin/badges" className="rounded-2xl bg-surface p-5 shadow-clay-surface border border-surface-border hover:shadow-clay-primary transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="material-symbols-outlined text-error text-[24px]" style={{ fontVariationSettings: 'FILL 1' }}>military_tech</span>
            <span className="font-headline-xl text-headline-xl text-error font-extrabold">{badgeCount}</span>
          </div>
          <p className="font-label-md text-text-primary font-semibold">Total Badges</p>
          <p className="font-body-sm text-text-muted">Achievement system</p>
        </Link>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="font-headline-md text-headline-md text-text-primary font-extrabold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/admin/users" className="rounded-2xl bg-tertiary/10 p-4 border border-tertiary/20 hover:bg-tertiary/20 transition-all flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-tertiary text-white flex items-center justify-center shadow-clay-tertiary">
              <span className="material-symbols-outlined text-[20px]">person_add</span>
            </div>
            <div>
              <p className="font-label-md text-text-primary font-semibold">Add User</p>
              <p className="font-body-sm text-text-muted">Create new user</p>
            </div>
          </Link>

          <Link href="/admin/courses/new" className="rounded-2xl bg-primary/10 p-4 border border-primary/20 hover:bg-primary/20 transition-all flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shadow-clay-primary">
              <span className="material-symbols-outlined text-[20px]">add</span>
            </div>
            <div>
              <p className="font-label-md text-text-primary font-semibold">New Course</p>
              <p className="font-body-sm text-text-muted">Create course</p>
            </div>
          </Link>

          <Link href="/admin/badges" className="rounded-2xl bg-secondary/10 p-4 border border-secondary/20 hover:bg-secondary/20 transition-all flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary text-white flex items-center justify-center shadow-clay-secondary">
              <span className="material-symbols-outlined text-[20px]">emoji_events</span>
            </div>
            <div>
              <p className="font-label-md text-text-primary font-semibold">Create Badge</p>
              <p className="font-body-sm text-text-muted">New achievement</p>
            </div>
          </Link>

          <Link href="/admin/tutoring" className="rounded-2xl bg-error/10 p-4 border border-error/20 hover:bg-error/20 transition-all flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-error text-white flex items-center justify-center shadow-clay-error">
              <span className="material-symbols-outlined text-[20px]">support_agent</span>
            </div>
            <div>
              <p className="font-label-md text-text-primary font-semibold">Manage Tutors</p>
              <p className="font-body-sm text-text-muted">Tutor oversight</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Courses Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-headline-md text-headline-md text-text-primary font-extrabold">Recent Courses</h2>
            <p className="mt-1 font-body-sm text-text-muted">
              Latest 10 courses (manage all in Courses page)
            </p>
          </div>
          <Link
            href="/admin/courses"
            className="rounded-full bg-primary text-white px-5 py-2.5 font-label-md font-bold shadow-clay-primary active:shadow-clay-primary-pressed hover:bg-primary-dark transition-all active:translate-y-[2px]"
          >
            View All Courses
          </Link>
        </div>

      {allCourses.length === 0 ? (
        <div className="rounded-2xl bg-surface p-12 text-center shadow-clay-surface border border-surface-border">
          <div className="relative w-20 h-20 rounded-2xl bg-surface-border flex items-center justify-center overflow-hidden shadow-clay-surface mx-auto mb-4">
            <Mascot pose="empty" size={64} />
          </div>
          <p className="font-body-md text-text-muted">No courses yet. Create your first course above.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {allCourses.map((course) => (
            <Link
              key={course.id}
              href={`/admin/courses/${course.id}`}
              className="group rounded-2xl bg-surface p-5 shadow-clay-surface border border-surface-border hover:shadow-clay-primary transition-all"
            >
              <div className="flex items-start justify-between">
                <h2 className="font-label-lg text-text-primary font-semibold group-hover:text-primary">
                  {course.title}
                </h2>
                <span
                  className={`ml-2 rounded-full px-2 py-0.5 font-label-sm font-bold ${
                    course.isPublished
                      ? "bg-success text-white"
                      : "bg-locked text-text-muted"
                  }`}
                >
                  {course.isPublished ? "Published" : "Draft"}
                </span>
              </div>
              <p className="mt-3 font-label-sm font-semibold text-primary group-hover:underline">
                Manage →
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  </div>
  );
}
