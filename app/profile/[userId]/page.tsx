import { db } from "@/db";
import { profiles, userProgress, userBadges, badges, friendships } from "@/db/schema";
import { eq, and, desc, or, inArray } from "drizzle-orm";
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

  // Get user's completed lessons count, earned badges, all badges, and friendship status in parallel for speed
  const [completedLessons, userBadgesData, allBadges, friendship] = await Promise.all([
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
      .limit(1) : Promise.resolve([])
  ]);

  const earnedBadgeIds = userBadgesData.map((b: any) => b.id);
  const lockedBadges = allBadges.filter((b: any) => !earnedBadgeIds.includes(b.id));

  let friendshipStatus = null;
  if (friendship && friendship.length > 0) {
    friendshipStatus = friendship[0].status;
  }

  const isOwnProfile = currentUser?.id === targetUserId;

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
            <div className="w-24 h-24 bg-primary rounded-full flex items-center justify-center text-4xl text-on-primary shadow-clay-primary">
              {profile.displayName?.[0] || "?"}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="px-3 py-0.5 rounded-lg bg-surface-container-high text-text-muted font-label-sm text-label-sm tracking-wider uppercase">{profile.role}</span>
              </div>
              <h1 className="font-headline-xl text-headline-xl text-text-primary tracking-tight leading-none">
                {profile.displayName || "Anonymous"}
              </h1>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-tertiary/10 text-tertiary font-label-md text-label-md">
                  <span className="material-symbols-outlined text-[18px]">bolt</span>
                  <span>{profile.xp} XP</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-surface-container-high text-text-primary font-label-md text-label-md">
                  <span className="material-symbols-outlined text-secondary text-[18px]" style={{ fontVariationSettings: 'FILL 1' }}>local_fire_department</span>
                  <span>{profile.streakCount} day streak</span>
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
              <div className="order-2 sm:order-1">
                {friendshipStatus === "accepted" ? (
                  <span className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full font-label-md font-bold shadow-clay-primary">
                    <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: 'FILL 1' }}>check_circle</span>
                    <span>Friends</span>
                  </span>
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="rounded-xl bg-surface shadow-clay-surface border border-surface-border p-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-primary text-[24px]">bolt</span>
            <h3 className="font-label-sm text-text-muted font-medium">Total XP</h3>
          </div>
          <p className="font-headline-xl text-headline-xl text-primary font-extrabold">{profile.xp}</p>
        </div>
        <div className="rounded-xl bg-surface shadow-clay-surface border border-surface-border p-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-primary-container text-[24px]" style={{ fontVariationSettings: 'FILL 1' }}>check_circle</span>
            <h3 className="font-label-sm text-on-surface-variant font-medium">Lessons Completed</h3>
          </div>
          <p className="font-headline-xl text-headline-xl text-primary-container font-extrabold">{completedLessons.length}</p>
        </div>
        <div className="rounded-xl bg-surface shadow-clay-surface border border-surface-border p-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-secondary text-[24px]" style={{ fontVariationSettings: 'FILL 1' }}>local_fire_department</span>
            <h3 className="font-label-sm text-text-muted font-medium">Current Streak</h3>
          </div>
          <p className="font-headline-xl text-headline-xl text-secondary font-extrabold">{profile.streakCount} days</p>
        </div>
      </div>

      {/* Badges Section */}
      <div className="rounded-2xl bg-surface shadow-clay-surface border border-surface-border mb-6">
        <div className="p-4 border-b border-surface-border">
          <h2 className="font-headline-md text-headline-md text-text-primary font-extrabold">Badges ({userBadgesData.length}/{allBadges.length})</h2>
        </div>
        
        {allBadges.length === 0 ? (
          <div className="p-6 text-center font-body-md text-text-muted">
            No badges available
          </div>
        ) : (
          <div className="p-6">
            <h3 className="font-label-md text-text-primary font-semibold mb-4">Earned Badges</h3>
            {userBadgesData.length === 0 ? (
              <div className="p-6 text-center font-body-md text-text-muted bg-surface-container rounded-2xl mb-6">
                <div className="relative w-16 h-16 rounded-xl bg-surface-container flex items-center justify-center overflow-hidden shadow-clay-surface mx-auto mb-4">
                  <Mascot pose="empty" size={64} />
                </div>
                No badges earned yet
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {userBadgesData.map((badge: any) => (
                  <div key={badge.id} className="text-center p-4 bg-gradient-to-br from-secondary to-secondary/10 rounded-2xl border border-secondary shadow-clay-secondary">
                    <div className="w-16 h-16 bg-gradient-to-br from-secondary to-secondary/80 rounded-full mx-auto mb-2 flex items-center justify-center text-2xl shadow-clay-secondary">
                      🏆
                    </div>
                    <p className="font-label-md text-text-primary font-semibold">{badge.name}</p>
                    <p className="font-body-sm text-text-muted mt-1">{badge.description}</p>
                  </div>
                ))}
              </div>
            )}

            <h3 className="font-label-md text-text-primary font-semibold mb-4">Locked Badges</h3>
            {lockedBadges.length === 0 ? (
              <div className="p-6 text-center font-body-md text-primary bg-primary/10 rounded-2xl border border-primary">
                All badges earned! 🎉
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {lockedBadges.map((badge: any) => (
                  <div key={badge.id} className="text-center p-4 bg-surface-container rounded-2xl border border-surface-border opacity-60">
                    <div className="w-16 h-16 bg-surface-container-high rounded-full mx-auto mb-2 flex items-center justify-center text-2xl">
                      🔒
                    </div>
                    <p className="font-label-md text-text-muted font-semibold">{badge.name}</p>
                    <p className="font-body-sm text-text-muted mt-1">{badge.description}</p>
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
