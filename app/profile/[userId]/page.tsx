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
    <div className="w-full min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Hero Header Section */}
      <div className="relative w-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 p-8 md:p-12 mb-8">
        {/* Decorative patterns */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-40 h-40 bg-white rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative z-10 max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            {/* Avatar Section */}
            <div className="relative shrink-0">
              <div className="w-32 h-32 md:w-40 md:h-40 bg-gradient-to-br from-white to-blue-100 rounded-full flex items-center justify-center text-5xl md:text-6xl font-bold text-blue-600 shadow-2xl border-4 border-white">
                {profile.displayName?.[0] || "?"}
              </div>
              <div className="absolute -bottom-3 -right-3 w-14 h-14 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-2xl shadow-xl border-3 border-white">
                {userTitle.icon}
              </div>
            </div>
            
            {/* User Info */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-3">
                <span className="px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-sm text-white font-label-sm font-bold tracking-wider uppercase shadow-lg border border-white/30">
                  {profile.role}
                </span>
                <span className={`px-4 py-1.5 rounded-full bg-gradient-to-r ${userTitle.color} text-white font-label-sm font-bold tracking-wider uppercase shadow-lg`}>
                  {userTitle.title}
                </span>
              </div>
              <h1 className="font-headline-2xl text-headline-2xl text-white font-extrabold mb-3">
                {profile.displayName || "Anonymous"}
              </h1>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm text-white font-label-md font-semibold shadow-lg">
                  <span className="material-symbols-outlined text-[20px]">bolt</span>
                  <span>{profile.xp} XP</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm text-white font-label-md font-semibold shadow-lg">
                  <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: 'FILL 1' }}>local_fire_department</span>
                  <span>{profile.streakCount} day streak</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm text-white font-label-md font-semibold shadow-lg">
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
                        <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-blue-600 rounded-full font-label-md font-bold shadow-xl hover:bg-blue-50 transition-all active:scale-95">
                          <span className="material-symbols-outlined text-[20px]">chat</span>
                          <span>Message</span>
                        </button>
                      </form>
                      <span className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-500 text-white rounded-full font-label-md font-bold shadow-xl">
                        <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: 'FILL 1' }}>check_circle</span>
                        <span>Friends</span>
                      </span>
                    </>
                  ) : friendshipStatus === "pending" ? (
                    <span className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/30 backdrop-blur-sm text-white rounded-full font-label-md font-bold shadow-xl">
                      <span className="material-symbols-outlined text-[20px]">schedule</span>
                      <span>Pending</span>
                    </span>
                  ) : friendshipStatus === "blocked" ? (
                    <span className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-500 text-white rounded-full font-label-md font-bold shadow-xl">
                      <span className="material-symbols-outlined text-[20px]">block</span>
                      <span>Blocked</span>
                    </span>
                  ) : (
                    <form action={async () => {
                      "use server";
                      await sendFriendRequest(targetUserId);
                    }}>
                      <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-blue-600 rounded-full font-label-md font-bold shadow-xl hover:bg-blue-50 transition-all active:scale-95">
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
          <div className="bg-white rounded-2xl p-6 shadow-xl border border-blue-100 hover:shadow-2xl transition-all">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-white text-[24px]">bolt</span>
              </div>
              <h3 className="font-label-sm text-gray-600 font-medium">Total XP</h3>
            </div>
            <p className="font-headline-2xl text-headline-2xl text-blue-600 font-extrabold">{profile.xp}</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-xl border border-green-100 hover:shadow-2xl transition-all">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-white text-[24px]" style={{ fontVariationSettings: 'FILL 1' }}>check_circle</span>
              </div>
              <h3 className="font-label-sm text-gray-600 font-medium">Lessons</h3>
            </div>
            <p className="font-headline-2xl text-headline-2xl text-green-600 font-extrabold">{completedLessons.length}</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-xl border border-orange-100 hover:shadow-2xl transition-all">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-white text-[24px]" style={{ fontVariationSettings: 'FILL 1' }}>local_fire_department</span>
              </div>
              <h3 className="font-label-sm text-gray-600 font-medium">Streak</h3>
            </div>
            <p className="font-headline-2xl text-headline-2xl text-orange-600 font-extrabold">{profile.streakCount}d</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-xl border border-purple-100 hover:shadow-2xl transition-all">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-white text-[24px]">school</span>
              </div>
              <h3 className="font-label-sm text-gray-600 font-medium">Courses</h3>
            </div>
            <p className="font-headline-2xl text-headline-2xl text-purple-600 font-extrabold">{coursesEnrolled[0]?.count || 0}</p>
          </div>
        </div>

        {/* Badges Section */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 mb-8 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 p-6">
            <h2 className="font-headline-xl text-headline-xl text-white font-extrabold flex items-center gap-3">
              <span className="material-symbols-outlined text-[32px]">military_tech</span>
              Achievements ({userBadgesData.length}/{allBadges.length})
            </h2>
          </div>

          {allBadges.length === 0 ? (
            <div className="p-8 text-center font-body-md text-gray-500">
              No badges available
            </div>
          ) : (
            <div className="p-6">
              {/* Progress Bar */}
              <div className="mb-8">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-label-md text-gray-700 font-semibold">Progress</span>
                  <span className="font-label-sm text-gray-500 font-bold">{Math.round((userBadgesData.length / allBadges.length) * 100)}%</span>
                </div>
                <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-700 ease-out"
                    style={{ width: `${(userBadgesData.length / allBadges.length) * 100}%` }}
                  ></div>
                </div>
              </div>

              <h3 className="font-label-lg text-gray-800 font-bold mb-5 flex items-center gap-2">
                <span className="material-symbols-outlined text-yellow-500 text-[24px]" style={{ fontVariationSettings: 'FILL 1' }}>emoji_events</span>
                Earned Badges
              </h3>
              {userBadgesData.length === 0 ? (
                <div className="p-8 text-center font-body-md text-gray-500 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl mb-6 border-2 border-dashed border-blue-200">
                  <div className="relative w-20 h-20 rounded-xl bg-white flex items-center justify-center overflow-hidden shadow-lg mx-auto mb-4">
                    <Mascot pose="empty" size={80} />
                  </div>
                  <p className="font-body-md text-gray-600 font-semibold">No badges earned yet. Keep learning!</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-5 mb-8">
                  {userBadgesData.map((badge: any) => (
                    <div key={badge.id} className="text-center p-5 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl border-2 border-yellow-300 shadow-lg transform hover:scale-105 transition-all cursor-pointer">
                      <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full mx-auto mb-3 flex items-center justify-center text-4xl shadow-xl border-4 border-white">
                        🏆
                      </div>
                      <p className="font-label-md text-gray-800 font-semibold text-sm">{badge.name}</p>
                      <p className="font-body-xs text-gray-600 mt-1 line-clamp-2">{badge.description}</p>
                    </div>
                  ))}
                </div>
              )}

              <h3 className="font-label-lg text-gray-800 font-bold mb-5 flex items-center gap-2">
                <span className="material-symbols-outlined text-gray-400 text-[24px]">lock</span>
                Locked Badges
              </h3>
              {lockedBadges.length === 0 ? (
                <div className="p-8 text-center font-body-md text-green-600 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border-2 border-green-300">
                  🎉 All badges earned! You're a champion!
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-5">
                  {lockedBadges.map((badge: any) => (
                    <div key={badge.id} className="text-center p-5 bg-gray-50 rounded-2xl border-2 border-gray-200 opacity-50 grayscale hover:grayscale-0 hover:opacity-70 transition-all cursor-pointer">
                      <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-3 flex items-center justify-center text-4xl border-2 border-gray-300">
                        🔒
                      </div>
                      <p className="font-label-md text-gray-600 font-semibold text-sm">{badge.name}</p>
                      <p className="font-body-xs text-gray-500 mt-1 line-clamp-2">{badge.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h2 className="font-headline-xl text-headline-xl text-gray-800 font-extrabold flex items-center gap-3">
              <span className="material-symbols-outlined text-blue-600 text-[28px]">history</span>
              Recent Activity
            </h2>
          </div>
          
          <div className="p-8 text-center font-body-md text-gray-500">
            <div className="relative w-16 h-16 rounded-xl bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center overflow-hidden shadow-lg mx-auto mb-4">
              <Mascot pose="empty" size={64} />
            </div>
            <p className="font-body-md text-gray-600 font-semibold">Activity tracking coming soon</p>
          </div>
        </div>
      </div>
    </div>
  );
}
