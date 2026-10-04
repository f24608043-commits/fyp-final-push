import { db } from "@/db";
import { profiles, userProgress, userBadges, badges, friendships, enrollments } from "@/db/schema";
import { eq, and, desc, or, inArray, count } from "drizzle-orm";
import { createClient } from "@/utils/supabase/server";
import { sendFriendRequest } from "@/app/friends/actions";
import Mascot from "@/components/Mascot";

export default async function ProfilePage({ params }: { params: Promise<{ userId: string }> }) {
  const supabase = await createClient();
  const { data: { user: currentUser } } = await supabase.auth.getUser();
  
  const { userId: targetUserId } = await params;

  if (!targetUserId) {
    return (
      <div className="w-full px-6 py-6">
        <h1 className="font-headline-xl text-headline-xl text-text-primary font-extrabold">Invalid User ID</h1>
        <p className="font-body-md text-text-muted">User ID is required to view a profile.</p>
      </div>
    );
  }

  // Get target user profile
  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, targetUserId))
    .limit(1);

  if (!profile) {
    return (
      <div className="w-full px-6 py-6">
        <h1 className="font-headline-xl text-headline-xl text-text-primary font-extrabold">User Not Found</h1>
        <p className="font-body-md text-text-muted">This user profile does not exist.</p>
      </div>
    );
  }

  // Get user's completed lessons count, earned badges, all badges, friendship status, courses enrolled, and friends count in parallel for speed
  let completedLessons: any[] = [];
  let userBadgesData: any[] = [];
  let allBadges: any[] = [];
  let friendship: any[] = [];
  let coursesEnrolled: any[] = [];
  let friendsCount: any[] = [];

  try {
    const results = await Promise.all([
      db
        .select({ count: userProgress.lessonId })
        .from(userProgress)
        .where(
          and(
            eq(userProgress.userId, targetUserId),
            eq(userProgress.status, "completed")
          )
        ),
      db
        .select({
          id: badges.id,
          name: badges.name,
          description: badges.description,
        })
        .from(userBadges)
        .innerJoin(badges, eq(userBadges.badgeId, badges.id))
        .where(eq(userBadges.userId, targetUserId)),
      db
        .select({
          id: badges.id,
          name: badges.name,
          description: badges.description,
          criteriaType: badges.criteriaType,
          criteriaValue: badges.criteriaValue,
        })
        .from(badges),
      currentUser ? db
        .select()
        .from(friendships)
        .where(
          or(
            and(
              eq(friendships.requesterId, currentUser.id),
              eq(friendships.addresseeId, targetUserId)
            ),
            and(
              eq(friendships.requesterId, targetUserId),
              eq(friendships.addresseeId, currentUser.id)
            )
          )
        )
        .limit(1) : Promise.resolve([]),
      db
        .select({ count: count() })
        .from(enrollments)
        .where(eq(enrollments.userId, targetUserId)),
      db
        .select({ count: count() })
        .from(friendships)
        .where(
          and(
            or(eq(friendships.requesterId, targetUserId), eq(friendships.addresseeId, targetUserId)),
            eq(friendships.status, "accepted")
          )
        )
    ]);
    completedLessons = results[0] || [];
    userBadgesData = results[1] || [];
    allBadges = results[2] || [];
    friendship = results[3] || [];
    coursesEnrolled = results[4] || [];
    friendsCount = results[5] || [];
  } catch (error) {
    console.error("Error fetching profile data:", error);
    // Continue with empty arrays if fetch fails
  }

  const earnedBadgeIds = userBadgesData.map((b: any) => b.id);
  const lockedBadges = allBadges.filter((b: any) => !earnedBadgeIds.includes(b.id));

  let friendshipStatus = null;
  if (friendship && friendship.length > 0) {
    friendshipStatus = friendship[0].status;
  }

  const isOwnProfile = currentUser?.id === targetUserId;

  // Duolingo-style title system based on XP
  const getTitle = (xp: number) => {
    if (xp >= 10000) return { title: "Diamond League", color: "bg-tertiary", icon: "💎" };
    if (xp >= 5000) return { title: "Platinum League", color: "bg-surface-border", icon: "🥇" };
    if (xp >= 2000) return { title: "Gold League", color: "bg-secondary", icon: "🥈" };
    if (xp >= 1000) return { title: "Silver League", color: "bg-surface-border", icon: "🥉" };
    if (xp >= 500) return { title: "Bronze League", color: "bg-secondary", icon: "🏅" };
    if (xp >= 100) return { title: "Iron League", color: "bg-surface-border", icon: "⚔️" };
    return { title: "Novice", color: "bg-success", icon: "🌱" };
  };

  const userTitle = getTitle(profile.xp);

  return (
    <div className="w-full min-h-screen bg-tertiary/10">
      {/* Hero Header Section */}
      <div className="relative w-full bg-tertiary p-8 md:p-12 mb-8">
        {/* Decorative patterns */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 bg-surface rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-40 h-40 bg-surface rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-surface rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative z-10 max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            {/* Avatar Section */}
            <div className="relative shrink-0">
              <div className="w-32 h-32 md:w-40 md:h-40 bg-gradient-to-br from-surface to-tertiary/10 rounded-full flex items-center justify-center text-5xl md:text-6xl font-bold text-tertiary shadow-clay-surface border-4 border-surface">
                {profile.displayName?.[0] || "?"}
              </div>
              <div className="absolute -bottom-3 -right-3 w-14 h-14 bg-secondary rounded-full flex items-center justify-center text-2xl shadow-clay-surface border-3 border-surface">
                {userTitle.icon}
              </div>
            </div>
            
            {/* User Info */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-3">
                <span className="px-4 py-1.5 rounded-full bg-surface/20 backdrop-blur-sm text-text-primary font-label-sm font-bold tracking-wider uppercase shadow-clay-surface border border-surface/30">
                  {profile.role}
                </span>
                <span className={`px-4 py-1.5 rounded-full ${userTitle.color} text-text-primary font-label-sm font-bold tracking-wider uppercase shadow-clay-surface`}>
                  {userTitle.title}
                </span>
              </div>
              <h1 className="font-headline-2xl text-headline-2xl text-text-primary font-extrabold mb-3">
                {profile.displayName || "Anonymous"}
              </h1>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-surface/20 backdrop-blur-sm text-text-primary font-label-md font-semibold shadow-clay-surface">
                  <span className="material-symbols-outlined text-[20px]">bolt</span>
                  <span>{profile.xp} XP</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-surface/20 backdrop-blur-sm text-text-primary font-label-md font-semibold shadow-clay-surface">
                  <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: 'FILL 1' }}>local_fire_department</span>
                  <span>{profile.streakCount} day streak</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-surface/20 backdrop-blur-sm text-text-primary font-label-md font-semibold shadow-clay-surface">
                  <span className="material-symbols-outlined text-[20px]">groups</span>
                  <span>{friendsCount[0]?.count || 0} friends</span>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
              <div className="relative w-24 h-24 md:w-28 md:h-28">
                <Mascot pose="celebrate" size={112} />
              </div>
              {!isOwnProfile && currentUser && (
                <div className="flex gap-2">
                  {friendshipStatus === "accepted" ? (
                    <>
                      <form action={async () => {
                        "use server";
                        const { startDirectConversation } = await import("../../messaging/actions");
                        await startDirectConversation(targetUserId);
                      }}>
                        <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-surface text-tertiary rounded-full font-label-md font-bold shadow-clay-surface hover:bg-tertiary/10 transition-all active:scale-95">
                          <span className="material-symbols-outlined text-[20px]">chat</span>
                          <span>Message</span>
                        </button>
                      </form>
                      <span className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-text-primary rounded-full font-label-md font-bold shadow-clay-surface">
                        <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: 'FILL 1' }}>check_circle</span>
                        <span>Friends</span>
                      </span>
                    </>
                  ) : friendshipStatus === "pending" ? (
                    <span className="inline-flex items-center gap-2 px-5 py-2.5 bg-surface/30 backdrop-blur-sm text-text-primary rounded-full font-label-md font-bold shadow-clay-surface">
                      <span className="material-symbols-outlined text-[20px]">schedule</span>
                      <span>Pending</span>
                    </span>
                  ) : friendshipStatus === "blocked" ? (
                    <span className="inline-flex items-center gap-2 px-5 py-2.5 bg-error text-text-primary rounded-full font-label-md font-bold shadow-clay-surface">
                      <span className="material-symbols-outlined text-[20px]">block</span>
                      <span>Blocked</span>
                    </span>
                  ) : (
                    <form action={async () => {
                      "use server";
                      await sendFriendRequest(targetUserId);
                    }}>
                      <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-surface text-tertiary rounded-full font-label-md font-bold shadow-clay-surface hover:bg-tertiary/10 transition-all active:scale-95">
                        <span className="material-symbols-outlined text-[20px]">person_add</span>
                        <span>Add Friend</span>
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 pb-12">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-surface rounded-[24px] p-6 shadow-clay-surface border border-tertiary/30 hover:shadow-clay-surface transition-all">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-10 h-10 bg-tertiary rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-text-primary text-[24px]">bolt</span>
              </div>
              <h3 className="font-label-sm text-text-muted font-medium">Total XP</h3>
            </div>
            <p className="font-headline-2xl text-headline-2xl text-tertiary font-extrabold">{profile.xp}</p>
          </div>
          <div className="bg-surface rounded-[24px] p-6 shadow-clay-surface border border-primary/30 hover:shadow-clay-surface transition-all">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-success rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-text-primary text-[24px]" style={{ fontVariationSettings: 'FILL 1' }}>check_circle</span>
              </div>
              <h3 className="font-label-sm text-text-muted font-medium">Lessons</h3>
            </div>
            <p className="font-headline-2xl text-headline-2xl text-success font-extrabold">{completedLessons.length}</p>
          </div>
          <div className="bg-surface rounded-[24px] p-6 shadow-clay-surface border border-secondary/30 hover:shadow-clay-surface transition-all">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-text-primary text-[24px]" style={{ fontVariationSettings: 'FILL 1' }}>local_fire_department</span>
              </div>
              <h3 className="font-label-sm text-text-muted font-medium">Streak</h3>
            </div>
            <p className="font-headline-2xl text-headline-2xl text-secondary font-extrabold">{profile.streakCount}d</p>
          </div>
          <div className="bg-surface rounded-[24px] p-6 shadow-clay-surface border border-tertiary/30 hover:shadow-clay-surface transition-all">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-10 h-10 bg-tertiary rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-text-primary text-[24px]">school</span>
              </div>
              <h3 className="font-label-sm text-text-muted font-medium">Courses</h3>
            </div>
            <p className="font-headline-2xl text-headline-2xl text-tertiary font-extrabold">{coursesEnrolled[0]?.count || 0}</p>
          </div>
        </div>

        {/* Badges Section */}
        <div className="bg-surface rounded-3xl shadow-clay-surface border border-surface-border mb-8 overflow-hidden">
          <div className="bg-tertiary p-6">
            <h2 className="font-headline-xl text-headline-xl text-text-primary font-extrabold flex items-center gap-3">
              <span className="material-symbols-outlined text-[32px]">military_tech</span>
              Achievements ({userBadgesData.length}/{allBadges.length})
            </h2>
          </div>

          {allBadges.length === 0 ? (
            <div className="p-8 text-center font-body-md text-text-muted">
              No badges available
            </div>
          ) : (
            <div className="p-6">
              {/* Progress Bar */}
              <div className="mb-8">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-label-md text-text-muted font-semibold">Progress</span>
                  <span className="font-label-sm text-text-muted font-bold">{Math.round((userBadgesData.length / allBadges.length) * 100)}%</span>
                </div>
                <div className="w-full h-4 surface rounded-full overflow-hidden shadow-inner">
                  <div
                    className="h-full bg-tertiary transition-all duration-700 ease-out"
                    style={{ width: `${(userBadgesData.length / allBadges.length) * 100}%` }}
                  ></div>
                </div>
              </div>

              <h3 className="font-label-lg text-text-muted font-bold mb-5 flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[24px]" style={{ fontVariationSettings: 'FILL 1' }}>emoji_events</span>
                Earned Badges
              </h3>
              {userBadgesData.length === 0 ? (
                <div className="p-8 text-center font-body-md text-text-muted bg-tertiary/10 rounded-[24px] mb-6 border-2 border-dashed border-tertiary/30">
                  <div className="relative w-20 h-20 rounded-xl bg-surface flex items-center justify-center overflow-hidden shadow-clay-surface mx-auto mb-4">
                    <Mascot pose="empty" size={80} />
                  </div>
                  <p className="font-body-md text-text-muted font-semibold">No badges earned yet. Keep learning!</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-5 mb-8">
                  {userBadgesData.map((badge: any) => (
                    <div key={badge.id} className="text-center p-5 bg-secondary/10 rounded-[24px] border-2 border-secondary shadow-clay-surface transform hover:scale-105 transition-all cursor-pointer">
                      <div className="w-20 h-20 bg-secondary rounded-full mx-auto mb-3 flex items-center justify-center text-4xl shadow-clay-surface border-4 border-surface">
                        🏆
                      </div>
                      <p className="font-label-md text-text-muted font-semibold text-sm">{badge.name}</p>
                      <p className="font-body-xs text-text-muted mt-1 line-clamp-2">{badge.description}</p>
                    </div>
                  ))}
                </div>
              )}

              <h3 className="font-label-lg text-text-muted font-bold mb-5 flex items-center gap-2">
                <span className="material-symbols-outlined text-text-primary text-[24px]">lock</span>
                Locked Badges
              </h3>
              {lockedBadges.length === 0 ? (
                <div className="p-8 text-center font-body-md text-success bg-primary/10 rounded-[24px] border-2 border-success">
                  🎉 All badges earned! You're a champion!
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-5">
                  {lockedBadges.map((badge: any) => (
                    <div key={badge.id} className="text-center p-5 surface rounded-[24px] border-2 border-surface-border opacity-50 grayscale hover:grayscale-0 hover:opacity-70 transition-all cursor-pointer">
                      <div className="w-20 h-20 surface rounded-full mx-auto mb-3 flex items-center justify-center text-4xl border-2 border-surface-border">
                        🔒
                      </div>
                      <p className="font-label-md text-text-muted font-semibold text-sm">{badge.name}</p>
                      <p className="font-body-xs text-text-muted mt-1 line-clamp-2">{badge.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-surface rounded-3xl shadow-clay-surface border border-surface-border">
          <div className="p-6 border-b border-surface-border">
            <h2 className="font-headline-xl text-headline-xl text-text-muted font-extrabold flex items-center gap-3">
              <span className="material-symbols-outlined text-tertiary text-[28px]">history</span>
              Recent Activity
            </h2>
          </div>
          
          <div className="p-8 text-center font-body-md text-text-muted">
            <div className="relative w-16 h-16 rounded-xl bg-tertiary/10 flex items-center justify-center overflow-hidden shadow-clay-surface mx-auto mb-4">
              <Mascot pose="empty" size={64} />
            </div>
            <p className="font-body-md text-text-muted font-semibold">Activity tracking coming soon</p>
          </div>
        </div>
      </div>
    </div>
  );
}
