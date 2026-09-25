import { getFriendList, getPendingRequests, getSuggestedFriends, sendFriendRequest } from "./actions";
import { acceptFriendRequest, rejectFriendRequest, removeFriend } from "./actions";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Mascot from "@/components/Mascot";
import Link from "next/link";
import AddFriendButton from "./AddFriendButton";
import MessageButton from "./MessageButton";

export default async function FriendsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect("/sign-in");
  }

  let friends: any[] = [];
  let pendingRequests: any[] = [];
  let suggestedFriends: any[] = [];

  try {
    const result = await Promise.all([
      getFriendList(),
      getPendingRequests(),
      getSuggestedFriends()
    ]);
    friends = result[0] || [];
    pendingRequests = result[1] || [];
    suggestedFriends = result[2] || [];
  } catch (error) {
    console.error("Error loading friends data:", error);
    // Continue with empty state
  }

  return (
    <div className="w-full px-6 py-6 bg-gradient-to-br from-background via-pink-50 to-rose-50 min-h-screen">
      {/* Header with Mascot - Stitch Frame Style */}
      <div className="relative w-full bg-gradient-to-br from-pink-500 via-rose-500 to-red-500 rounded-3xl p-1 shadow-2xl overflow-hidden mb-6">
        <div className="absolute inset-0 rounded-3xl border-4 border-dashed border-white/40 pointer-events-none"></div>
        <div className="relative bg-white/95 backdrop-blur-sm rounded-2xl p-6 md:p-8">
        
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          {/* Left: Header info */}
          <div className="flex flex-col gap-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-4 py-1 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-white font-label-sm text-label-sm tracking-wider uppercase font-bold shadow-lg border-2 border-white/30">👥 Social Learning</span>
              <span className="text-text-muted text-label-sm">•</span>
              <span className="px-4 py-1 rounded-full bg-gradient-to-r from-red-500 to-orange-500 text-white font-label-sm text-label-sm font-bold shadow-lg border-2 border-white/30">Friends & Community</span>
            </div>
            <h1 className="font-headline-xl text-headline-xl text-text-primary tracking-tight leading-none">
              Friends & Social Learning 🤝
            </h1>
            <p className="font-body-lg text-body-lg text-text-muted leading-relaxed">
              Connect with other learners and track your progress together
            </p>
          </div>

          {/* Right: Mascot */}
          <div className="w-full lg:w-auto flex flex-col sm:flex-row items-center lg:items-end justify-center gap-4 shrink-0 self-center lg:self-auto">
            <div className="relative max-w-xs bg-gradient-to-br from-pink-100 to-rose-100 p-4 rounded-2xl shadow-xl border-4 border-white/50 order-2 sm:order-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-rose-500 text-[18px]" style={{ fontVariationSettings: 'FILL 1' }}>group</span>
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-rose-600 font-bold">Build Your Network</span>
              </div>
              <p className="font-headline-md text-label-md text-text-primary font-bold leading-snug">
                "Learning together is more fun! Add friends to stay motivated."
              </p>
            </div>
            <div className="relative w-28 h-28 md:w-32 md:h-32 shrink-0 order-1 sm:order-2">
              <Mascot pose="encouraging" size={128} />
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* Pending Friend Requests */}
      {pendingRequests.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="inline-flex h-2 w-2 rounded-full bg-primary animate-pulse"></span>
            <h2 className="font-headline-md text-headline-md text-text-primary font-extrabold">
              Pending Requests ({pendingRequests.length})
            </h2>
          </div>
          <div className="space-y-3">
            {pendingRequests.map((request: any) => (
              <div key={request.id} className="rounded-2xl bg-gradient-to-br from-white to-pink-50 p-4 shadow-xl border-4 border-pink-100">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-rose-500 text-white font-bold text-lg shadow-xl border-4 border-white/30">
                      {request.requester?.displayName?.[0] || "?"}
                    </div>
                    <div className="min-w-0">
                      <p className="font-label-md text-text-primary font-semibold truncate">
                        {request.requester?.displayName || "Unknown User"}
                      </p>
                      <p className="font-body-sm text-text-muted">
                        Sent {new Date(request.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <form action={async () => {
                      "use server";
                      await acceptFriendRequest(request.id);
                    }}>
                      <button className="rounded-full bg-gradient-to-r from-green-400 to-emerald-500 text-white px-4 py-2 font-label-md font-bold shadow-xl border-4 border-white/30 transform hover:scale-105 transition-all active:scale-95">
                        Accept
                      </button>
                    </form>
                    <form action={async () => {
                      "use server";
                      await rejectFriendRequest(request.id);
                    }}>
                      <button className="rounded-2xl border-4 border-gray-200 bg-gradient-to-br from-gray-100 to-gray-200 text-gray-600 px-4 py-2 font-label-md font-semibold hover:from-gray-200 hover:to-gray-300 transition-all shadow-lg">
                        Reject
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suggested Friends - Duolingo Style */}
      {suggestedFriends.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-secondary text-[24px]" style={{ fontVariationSettings: 'FILL 1' }}>person_add</span>
            <h2 className="font-headline-md text-headline-md text-text-primary font-extrabold">
              People You May Know ({suggestedFriends.length})
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {suggestedFriends.map((suggested: any) => (
              <div key={suggested.id} className="rounded-2xl bg-gradient-to-br from-white to-orange-50 p-5 shadow-xl border-4 border-orange-100 hover:shadow-2xl hover:border-orange-200 transition-all">
                <div className="flex items-center gap-3 mb-4">
                  <div className="relative">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-amber-500 text-white font-bold text-xl shadow-xl border-4 border-white/30">
                      {suggested.displayName?.[0] || "?"}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-br from-secondary to-secondary/80 rounded-full flex items-center justify-center text-xs border-2 border-white">
                      🔥
                    </div>
                  </div>
                  <div className="min-w-0">
                    <p className="font-label-md text-text-primary font-semibold truncate">
                      {suggested.displayName || "Unknown User"}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="material-symbols-outlined text-yellow-500 text-[16px]" style={{ fontVariationSettings: 'FILL 1' }}>stars</span>
                      <span className="font-body-sm text-yellow-600 font-bold">{suggested.xp} XP</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 font-body-sm text-text-muted">
                    <span className="material-symbols-outlined text-orange-500 text-[16px]" style={{ fontVariationSettings: 'FILL 1' }}>local_fire_department</span>
                    <span className="font-bold text-orange-600">{suggested.streakCount} day streak</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <form action={async () => {
                      "use server";
                      try {
                        await sendFriendRequest(suggested.id);
                      } catch (error) {
                        console.error("Error sending friend request:", error);
                        // Don't throw - let the page reload
                      }
                    }}>
                      <AddFriendButton suggestedId={suggested.id} />
                    </form>
                    <Link
                      href={`/profile/${suggested.id}`}
                      className="font-label-sm font-medium text-text-muted hover:text-primary transition-colors"
                    >
                      View
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Friend List */}
      <div>
        <h2 className="font-headline-md text-headline-md text-text-primary font-extrabold mb-4">
          My Friends ({friends.length})
        </h2>
        {friends.length === 0 ? (
          <div className="rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 p-8 text-center shadow-xl border-4 border-white/50">
            <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center overflow-hidden shadow-xl mx-auto mb-4 border-4 border-white/30">
              <Mascot pose="empty" size={64} />
            </div>
            <p className="font-body-md text-text-muted font-bold">No friends yet. Add some friends to get started!</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {friends.map((friend: any) => (
              <div key={friend.id} className="rounded-2xl bg-gradient-to-br from-white to-pink-50 p-5 shadow-xl border-4 border-pink-100 hover:shadow-2xl hover:border-pink-200 transition-all">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-rose-500 text-white font-bold text-xl shadow-xl border-4 border-white/30">
                    {friend.displayName?.[0] || "?"}
                  </div>
                  <div className="min-w-0">
                    <p className="font-label-md text-text-primary font-semibold truncate">
                      {friend.displayName || "Unknown User"}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="material-symbols-outlined text-yellow-500 text-[16px]" style={{ fontVariationSettings: 'FILL 1' }}>stars</span>
                      <span className="font-body-sm text-yellow-600 font-bold">{friend.xp} XP</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 font-body-sm text-text-muted">
                    <span className="material-symbols-outlined text-orange-500 text-[16px]" style={{ fontVariationSettings: 'FILL 1' }}>local_fire_department</span>
                    <span className="font-bold text-orange-600">{friend.streakCount} day streak</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <form action={async () => {
                      "use server";
                      const { startDirectConversation } = await import("../messaging/actions");
                      await startDirectConversation(friend.id);
                    }}>
                      <MessageButton />
                    </form>
                    <Link
                      href={`/profile/${friend.id}`}
                      className="font-label-sm font-bold bg-gradient-to-r from-pink-500 to-rose-500 text-white px-4 py-2 rounded-full shadow-lg border-2 border-white/30 hover:scale-105 transition-transform"
                    >
                      View
                    </Link>
                    <form action={async () => {
                      "use server";
                      await removeFriend(friend.id);
                    }}>
                      <button className="font-label-sm font-medium text-error hover:text-error/80 transition-colors">
                        Remove
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
