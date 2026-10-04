import { createClient } from "@/utils/supabase/server";
import { db } from "@/db";
import { profiles, enrollments, courses, notifications } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { redirect } from "next/navigation";
import Mascot from "@/components/Mascot";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  let profile = null;
  let recentEnrollments: any[] = [];
  let recentNotifications: any[] = [];

  try {
    const [profileResult, enrollmentsResult, notificationsResult] = await Promise.all([
      db.select().from(profiles).where(eq(profiles.id, user.id)).limit(1),
      db
        .select({
          id: enrollments.id,
          courseId: enrollments.courseId,
          enrolledAt: enrollments.enrolledAt,

        })
        .from(enrollments)
        .where(eq(enrollments.userId, user.id))
        .orderBy(desc(enrollments.enrolledAt))
        .limit(5),
      db
        .select()
        .from(notifications)
        .where(eq(notifications.userId, user.id))
        .orderBy(desc(notifications.createdAt))
        .limit(10)
    ]);
    profile = profileResult[0];
    recentEnrollments = enrollmentsResult;
    recentNotifications = notificationsResult;
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
  }

  if (!profile) {
    redirect("/onboarding");
  }

  const level = Math.floor(Math.sqrt((profile.xp || 0) / 100)) + 1;
  const xpForNextLevel = level * level * 100;
  const xpProgress = ((profile.xp || 0) / xpForNextLevel) * 100;

  return (
    <div className="w-full px-6 py-6 bg-gradient-to-br from-background via-tertiary/10 to-tertiary/10 min-h-screen">
      {/* Header with Mascot - Stitch Frame Style */}
      <div className="relative w-full bg-tertiary rounded-3xl p-1 shadow-clay-surface overflow-hidden mb-6">
        <div className="absolute inset-0 rounded-3xl border-4 border-dashed border-surface/40 pointer-events-none"></div>
        <div className="relative bg-surface/95 backdrop-blur-sm rounded-[24px] p-6 md:p-8">

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex flex-col gap-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-4 py-1 rounded-full bg-tertiary text-text-primary font-label-sm text-label-sm tracking-wider uppercase font-bold shadow-clay-surface border-2 border-surface/30">📊 Dashboard</span>
              <span className="text-text-muted text-label-sm">•</span>
              <span className="px-4 py-1 rounded-full bg-tertiary text-text-primary font-label-sm text-label-sm font-bold shadow-clay-surface border-2 border-surface/30">Welcome Back!</span>
            </div>
            <h1 className="font-headline-xl text-headline-xl text-text-primary tracking-tight leading-none">
              Your Learning Dashboard
            </h1>
            <p className="font-body-lg text-body-lg text-text-muted leading-relaxed">
              Track your progress, view notifications, and continue your learning journey
            </p>
          </div>

          <div className="w-full lg:w-auto flex flex-col sm:flex-row items-center lg:items-end justify-center gap-4 shrink-0 self-center lg:self-auto">
            <div className="relative max-w-xs bg-tertiary/10 p-4 rounded-[24px] shadow-clay-surface border-4 border-surface/50 order-2 sm:order-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-tertiary text-[18px]" style={{ fontVariationSettings: 'FILL 1' }}>trending_up</span>
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-tertiary font-bold">Keep Going!</span>
              </div>
              <p className="font-headline-md text-label-md text-text-primary font-bold leading-snug">
                "You're making great progress on your learning journey!"
              </p>
            </div>
            <div className="relative w-28 h-28 md:w-32 md:h-32 shrink-0 order-1 sm:order-2">
              <Mascot pose="celebrate" size={128} />
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="rounded-[24px] bg-secondary/10 p-5 shadow-clay-surface border-4 border-secondary/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-3xl">⚡</span>
            <span className="font-headline-xl text-secondary font-extrabold">{profile.xp?.toLocaleString() || 0}</span>
          </div>
          <p className="font-label-md text-secondary font-semibold">Total XP</p>
          <div className="mt-2 h-2 bg-secondary/10 rounded-full overflow-hidden">
            <div className="h-full bg-secondary rounded-full" style={{ width: `${xpProgress}%` }}></div>
          </div>
          <p className="font-body-sm text-secondary mt-1">{xpProgress.toFixed(0)}% to Level {level + 1}</p>
        </div>

        <div className="rounded-[24px] bg-gradient-to-br from-secondary/10 to-error/10 p-5 shadow-clay-surface border-4 border-secondary/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-3xl">🔥</span>
            <span className="font-headline-xl text-secondary font-extrabold">{profile.streakCount || 0}</span>
          </div>
          <p className="font-label-md text-secondary font-semibold">Day Streak</p>
          <p className="font-body-sm text-secondary mt-1">Keep it up!</p>
        </div>

        <div className="rounded-[24px] bg-tertiary/10 p-5 shadow-clay-surface border-4 border-tertiary/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-3xl">📊</span>
            <span className="font-headline-xl text-tertiary font-extrabold">{level}</span>
          </div>
          <p className="font-label-md text-tertiary font-semibold">Current Level</p>
          <p className="font-body-sm text-tertiary mt-1">{xpForNextLevel - (profile.xp || 0)} XP to next level</p>
        </div>

        <div className="rounded-[24px] bg-primary/10 p-5 shadow-clay-surface border-4 border-primary/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-3xl">📚</span>
            <span className="font-headline-xl text-success font-extrabold">{recentEnrollments.length}</span>
          </div>
          <p className="font-label-md text-success font-semibold">Enrolled Courses</p>
          <Link href="/path" className="font-body-sm text-primary mt-1 hover:underline">Continue Learning →</Link>
        </div>
      </div>

      {/* Notifications Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[24px]" style={{ fontVariationSettings: 'FILL 1' }}>notifications</span>
            <h2 className="font-headline-md text-headline-md text-text-primary font-extrabold">Recent Notifications</h2>
          </div>
          <Link href="/notifications" className="text-primary font-label-sm font-semibold hover:underline">
            View All
          </Link>
        </div>
        {recentNotifications.length === 0 ? (
          <div className="rounded-[24px] bg-surface p-8 text-center shadow-clay-surface border-4 border-surface/50">
            <div className="relative w-20 h-20 rounded-xl bg-surface-border flex items-center justify-center overflow-hidden shadow-clay-surface mx-auto mb-4 border-4 border-surface/30">
              <Mascot pose="empty" size={64} />
            </div>
            <p className="font-body-md text-text-muted font-bold">No notifications yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentNotifications.map((notification: any) => (
              <div key={notification.id} className="rounded-[24px] bg-gradient-to-br from-surface to-tertiary/10 p-4 shadow-clay-surface border-4 border-tertiary/30">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    notification.type === 'lesson_completed' ? 'bg-primary/10 text-success' :
                    notification.type === 'badge_earned' ? 'bg-secondary/10 text-secondary' :
                    'bg-tertiary/10 text-tertiary'
                  }`}>
                    <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: 'FILL 1' }}>
                      {notification.type === 'lesson_completed' ? 'check_circle' :
                       notification.type === 'badge_earned' ? 'emoji_events' :
                       'notifications'}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-label-md text-text-primary font-semibold">{notification.title}</p>
                    <p className="font-body-sm text-text-muted mt-1">{notification.message}</p>
                    <p className="font-body-sm text-text-muted mt-2 text-xs">
                      {new Date(notification.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-primary text-[24px]" style={{ fontVariationSettings: 'FILL 1' }}>rocket_launch</span>
          <h2 className="font-headline-md text-headline-md text-text-primary font-extrabold">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/path" className="rounded-[24px] bg-tertiary/10 p-4 border-4 border-tertiary/30 hover:from-tertiary/10 hover:to-tertiary/10 transition-all flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-tertiary text-text-primary flex items-center justify-center shadow-clay-surface border-2 border-surface/30">
              <span className="material-symbols-outlined text-[20px]">school</span>
            </div>
            <div>
              <p className="font-label-md text-text-primary font-semibold">Continue Learning</p>
              <p className="font-body-sm text-text-muted">Resume your course</p>
            </div>
          </Link>

          <Link href="/library" className="rounded-[24px] bg-primary/10 p-4 border-4 border-primary/30 hover:from-primary/10 hover:to-primary/10 transition-all flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary text-text-primary flex items-center justify-center shadow-clay-surface border-2 border-surface/30">
              <span className="material-symbols-outlined text-[20px]">menu_book</span>
            </div>
            <div>
              <p className="font-label-md text-text-primary font-semibold">Browse Library</p>
              <p className="font-body-sm text-text-muted">Explore courses</p>
            </div>
          </Link>

          <Link href="/tutoring" className="rounded-[24px] bg-tertiary/10 p-4 border-4 border-tertiary/30 hover:from-tertiary/10 hover:to-tertiary/10 transition-all flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-tertiary text-text-primary flex items-center justify-center shadow-clay-surface border-2 border-surface/30">
              <span className="material-symbols-outlined text-[20px]">groups</span>
            </div>
            <div>
              <p className="font-label-md text-text-primary font-semibold">Find a Tutor</p>
              <p className="font-body-sm text-text-muted">Get help</p>
            </div>
          </Link>

          <Link href="/friends" className="rounded-[24px] bg-gradient-to-br from-secondary/10 to-error/10 p-4 border-4 border-secondary/30 hover:from-secondary/10 hover:to-error/10 transition-all flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-secondary to-error text-text-primary flex items-center justify-center shadow-clay-surface border-2 border-surface/30">
              <span className="material-symbols-outlined text-[20px]">diversity_3</span>
            </div>
            <div>
              <p className="font-label-md text-text-primary font-semibold">Friends</p>
              <p className="font-body-sm text-text-muted">Connect</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
