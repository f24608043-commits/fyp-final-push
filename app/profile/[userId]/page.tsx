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
    if (xp >= 10000) return { title: "Diamond League", color: "from-cyan-400 to-blue-500", icon: "💎" };
    if (xp >= 5000) return { title: "Platinum League", color: "from-gray-300 to-gray-400", icon: "🥇" };
    if (xp >= 2000) return { title: "Gold League", color: "from-yellow-400 to-amber-500", icon: "🥈" };
    if (xp >= 1000) return { title: "Silver League", color: "from-slate-300 to-slate-400", icon: "🥉" };
    if (xp >= 500) return { title: "Bronze League", color: "from-orange-400 to-orange-600", icon: "🏅" };
    if (xp >= 100) return { title: "Iron League", color: "from-gray-500 to-gray-700", icon: "⚔️" };
    return { title: "Novice", color: "from-green-400 to-green-600", icon: "🌱" };
  };

  const userTitle = getTitle(profile.xp);

  return (
    <div className="w-full px-6 py-6">
      {/* Profile Header with Mascot */}
      <div className="relative w-full rounded-3xl bg-surface p-6 md:p-8 shadow-clay-surface border border-surface-border overflow-hidden mb-6">
        {/* Decorative background gradients */}
        <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-primary/25 blur-3xl pointer-events-none"></div>
        <div className="absolute -left-20 -bottom-20 w-72 h-72 rounded-full bg-tertiary/30 blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          {/* Left: Profile info */}
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-24 h-24 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center text-4xl text-on-primary shadow-clay-primary border-4 border-white">
                {profile.displayName?.[0] || "?"}
              </div>
              <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-gradient-to-br from-secondary to-secondary/80 rounded-full flex items-center justify-center text-xl shadow-clay-secondary border-2 border-white">
                {userTitle.icon}
              </div>
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="px-3 py-0.5 rounded-lg bg-gradient-to-r from-primary to-primary/80 text-on-primary font-label-sm text-label-sm tracking-wider uppercase shadow-clay-primary">{profile.role}</span>
                <span className={`px-3 py-0.5 rounded-lg bg-gradient-to-r ${userTitle.color} text-white font-label-sm text-label-sm tracking-wider uppercase shadow-lg`}>{userTitle.title}</span>
              </div>
              <h1 className="font-headline-xl text-headline-xl text-text-primary tracking-tight leading-none">
                {profile.displayName || "Anonymous"}
              </h1>
              <div className="flex flex-wrap items-center gap-3 mt-2">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-tertiary/10 text-tertiary font-label-md text-label-md">
                  <span className="material-symbols-outlined text-[18px]">bolt</span>
                  <span>{profile.xp} XP</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-surface-container-high text-text-primary font-label-md text-label-md">
                  <span className="material-symbols-outlined text-secondary text-[18px]" style={{ fontVariationSettings: 'FILL 1' }}>local_fire_department</span>
                  <span>{profile.streakCount} day streak</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-primary/10 text-primary font-label-md text-label-md">
                  <span className="material-symbols-outlined text-[18px]">groups</span>
                  <span>{friendsCount[0]?.count || 0} friends</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right: Mascot + Friend Action */}
          <div className="w-full lg:w-auto flex flex-col sm:flex-row items-center lg:items-end justify-center gap-4 shrink-0 self-center lg:self-auto">
            <div className="relative w-28 h-28 md:w-32 md:h-32 shrink-0 order-1 sm:order-2">
              <Mascot pose="celebrate" size={128} />
            </div>
            {!isOwnProfile && currentUser && (
              <div className="order-2 sm:order-1 flex gap-2">
                {friendshipStatus === "accepted" ? (
                  <>
                    <form action={async () => {
                      "use server";
                      const { startDirectConversation } = await import("../../messaging/actions");
                      await startDirectConversation(targetUserId);
                    }}>
                      <button className="inline-flex items-center gap-2 px-4 py-2 bg-secondary text-on-secondary rounded-full font-label-md font-bold shadow-clay-secondary hover:bg-secondary/90 transition-all active:translate-y-[2px]">
                        <span className="material-symbols-outlined text-[18px]">chat</span>
                        <span>Message</span>
                      </button>
                    </form>
                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full font-label-md font-bold shadow-clay-primary">
                      <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: 'FILL 1' }}>check_circle</span>
                      <span>Friends</span>
                    </span>
                  </>
                ) : friendshipStatus === "pending" ? (
                  <span className="inline-flex items-center gap-2 px-4 py-2 bg-surface-container-high text-text-muted rounded-full font-label-md font-bold">
                    <span className="material-symbols-outlined text-[18px]">schedule</span>
                    <span>Pending</span>
                  </span>
                ) : friendshipStatus === "blocked" ? (
                  <span className="inline-flex items-center gap-2 px-4 py-2 bg-error/10 text-error rounded-full font-label-md font-bold">
                    <span className="material-symbols-outlined text-[18px]">block</span>
                    <span>Blocked</span>
                  </span>
                ) : (
                  <form action={async () => {
                    "use server";
                    await sendFriendRequest(targetUserId);
                  }}>
                    <button className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-full font-label-md font-bold shadow-clay-primary hover:bg-primary/90 transition-all active:translate-y-[2px]">
                      <span className="material-symbols-outlined text-[18px]">person_add</span>
                      <span>Add Friend</span>
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl bg-gradient-to-br from-surface to-surface-container shadow-clay-surface border border-surface-border p-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-primary text-[24px]">bolt</span>
            <h3 className="font-label-sm text-text-muted font-medium">Total XP</h3>
          </div>
          <p className="font-headline-xl text-headline-xl text-primary font-extrabold">{profile.xp}</p>
        </div>
        <div className="rounded-xl bg-gradient-to-br from-surface to-surface-container shadow-clay-surface border border-surface-border p-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-primary-container text-[24px]" style={{ fontVariationSettings: 'FILL 1' }}>check_circle</span>
            <h3 className="font-label-sm text-on-surface-variant font-medium">Lessons</h3>
          </div>
          <p className="font-headline-xl text-headline-xl text-primary-container font-extrabold">{completedLessons.length}</p>
        </div>
        <div className="rounded-xl bg-gradient-to-br from-surface to-surface-container shadow-clay-surface border border-surface-border p-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-secondary text-[24px]" style={{ fontVariationSettings: 'FILL 1' }}>local_fire_department</span>
            <h3 className="font-label-sm text-text-muted font-medium">Streak</h3>
          </div>
          <p className="font-headline-xl text-headline-xl text-secondary font-extrabold">{profile.streakCount}d</p>
        </div>
        <div className="rounded-xl bg-gradient-to-br from-surface to-surface-container shadow-clay-surface border border-surface-border p-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-tertiary text-[24px]">school</span>
            <h3 className="font-label-sm text-on-surface-variant font-medium">Courses</h3>
          </div>
          <p className="font-headline-xl text-headline-xl text-tertiary font-extrabold">{coursesEnrolled[0]?.count || 0}</p>
        </div>
      </div>

      {/* Badges Section - Duolingo Style */}
      <div className="rounded-2xl bg-gradient-to-br from-surface to-surface-container shadow-clay-surface border border-surface-border mb-6 overflow-hidden">
        <div className="bg-gradient-to-r from-primary to-primary/80 p-4">
          <h2 className="font-headline-md text-headline-md text-on-primary font-extrabold flex items-center gap-2">
            <span className="material-symbols-outlined text-[28px]">military_tech</span>
            Achievements ({userBadgesData.length}/{allBadges.length})
          </h2>
        </div>

        {allBadges.length === 0 ? (
          <div className="p-6 text-center font-body-md text-text-muted">
            No badges available
          </div>
        ) : (
          <div className="p-6">
            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="font-label-md text-text-primary font-semibold">Progress</span>
                <span className="font-label-sm text-text-muted">{Math.round((userBadgesData.length / allBadges.length) * 100)}%</span>
              </div>
              <div className="w-full h-3 bg-surface-container rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-500"
                  style={{ width: `${(userBadgesData.length / allBadges.length) * 100}%` }}
                ></div>
              </div>
            </div>

            <h3 className="font-label-md text-text-primary font-semibold mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-[20px]" style={{ fontVariationSettings: 'FILL 1' }}>emoji_events</span>
              Earned Badges
            </h3>
            {userBadgesData.length === 0 ? (
              <div className="p-6 text-center font-body-md text-text-muted bg-surface-container rounded-2xl mb-6 border border-surface-border">
                <div className="relative w-16 h-16 rounded-xl bg-surface-container-high flex items-center justify-center overflow-hidden shadow-clay-surface mx-auto mb-4">
                  <Mascot pose="empty" size={64} />
                </div>
                <p className="font-body-md text-text-muted">No badges earned yet. Keep learning!</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-6">
                {userBadgesData.map((badge: any) => (
                  <div key={badge.id} className="text-center p-4 bg-gradient-to-br from-secondary to-secondary/20 rounded-2xl border-2 border-secondary shadow-clay-secondary transform hover:scale-105 transition-all">
                    <div className="w-16 h-16 bg-gradient-to-br from-secondary to-secondary/80 rounded-full mx-auto mb-2 flex items-center justify-center text-3xl shadow-lg border-2 border-white">
                      🏆
                    </div>
                    <p className="font-label-md text-text-primary font-semibold text-sm">{badge.name}</p>
                    <p className="font-body-xs text-text-muted mt-1 line-clamp-2">{badge.description}</p>
                  </div>
                ))}
              </div>
            )}

            <h3 className="font-label-md text-text-primary font-semibold mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-text-muted text-[20px]">lock</span>
              Locked Badges
            </h3>
            {lockedBadges.length === 0 ? (
              <div className="p-6 text-center font-body-md text-primary bg-primary/10 rounded-2xl border border-primary">
                🎉 All badges earned! You're a champion!
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {lockedBadges.map((badge: any) => (
                  <div key={badge.id} className="text-center p-4 bg-surface-container rounded-2xl border border-surface-border opacity-60 grayscale">
                    <div className="w-16 h-16 bg-surface-container-high rounded-full mx-auto mb-2 flex items-center justify-center text-3xl border-2 border-surface-border">
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
      <div className="rounded-2xl bg-surface shadow-clay-surface border border-surface-border">
        <div className="p-4 border-b border-surface-border">
          <h2 className="font-headline-md text-headline-md text-text-primary font-extrabold">Recent Activity</h2>
        </div>
        
        <div className="p-6 text-center font-body-md text-text-muted">
          Activity tracking coming soon
        </div>
      </div>
    </div>
  );
}
