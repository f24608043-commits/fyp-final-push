import { getFriendList, getPendingRequests, getSuggestedFriends, sendFriendRequest } from "./actions";
import { acceptFriendRequest, rejectFriendRequest, removeFriend } from "./actions";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Mascot from "@/components/Mascot";
import Link from "next/link";
import AddFriendButton from "./AddFriendButton";
import MessageButton from "./MessageButton";

// Server action for accepting friend request
async function acceptRequest(requestId: string) {
  "use server";
  try {
    await acceptFriendRequest(requestId);
  } catch (error) {
    console.error("Accept friend request error:", error);
    throw error;
  }
}

// Server action for rejecting friend request
async function rejectRequest(requestId: string) {
  "use server";
  try {
    await rejectFriendRequest(requestId);
  } catch (error) {
    console.error("Reject friend request error:", error);
    throw error;
  }
}

// Server action for sending friend request
async function sendRequest(userId: string) {
  "use server";
  try {
    await sendFriendRequest(userId);
  } catch (error) {
    console.error("Send friend request error:", error);
    throw error;
  }
}

// Server action for messaging a friend
async function messageFriend(userId: string) {
  "use server";
  try {
    const { startDirectConversation } = await import("../messaging/actions");
    await startDirectConversation(userId);
  } catch (error) {
    console.error("Message friend error:", error);
    throw error;
  }
}

// Server action for removing friend
async function removeFriendAction(userId: string) {
  "use server";
  try {
    await removeFriend(userId);
  } catch (error) {
    console.error("Remove friend error:", error);
    throw error;
  }
}

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
          <div className="flex flex-col gap-2">
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

          {/* Right: Add Friend Button */}
          <Link
            href="/friends/add"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-white px-6 py-3 font-label-md font-bold shadow-xl border-4 border-white/30 transform hover:scale-105 transition-all active:scale-95 shrink-0"
          >
            <span className="material-symbols-outlined text-[20px]">person_add</span>
            Add Friend
          </Link>
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
          <div className="space-y-4">
            {pendingRequests.map((request: any) => (
              <div key={request.id} className="rounded-2xl bg-surface p-6 shadow-beautiful-md border border-surface-border">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xl shadow-beautiful-sm">
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
                  <div className="flex gap-3 shrink-0">
                    <form action={acceptRequest.bind(null, request.id)}>
                      <button className="rounded-full bg-primary text-white px-5 py-2.5 font-label-md font-bold shadow-beautiful-sm hover:shadow-beautiful-md transition-shadow duration-150">
                        Accept
                      </button>
                    </form>
                    <form action={rejectRequest.bind(null, request.id)}>
                      <button className="rounded-2xl border-2 border-surface-border bg-surface text-text-muted px-5 py-2.5 font-label-md font-semibold hover:bg-surface-border transition-colors duration-150 shadow-beautiful-sm">
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
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {suggestedFriends.map((suggested: any) => (
              <div key={suggested.id} className="rounded-2xl bg-surface p-6 shadow-beautiful-md border border-surface-border hover:shadow-beautiful-lg transition-shadow duration-150">
                <div className="flex items-center gap-4 mb-4">
                  <div className="relative">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary/10 text-secondary font-bold text-xl shadow-beautiful-sm">
                      {suggested.displayName?.[0] || "?"}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-secondary rounded-full flex items-center justify-center text-xs border-2 border-white shadow-beautiful-sm">
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
                    <form action={sendRequest.bind(null, suggested.id)}>
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
          <div className="rounded-2xl bg-surface p-12 text-center shadow-beautiful-md border border-surface-border">
            <div className="relative w-24 h-24 rounded-2xl bg-surface-border flex items-center justify-center overflow-hidden shadow-beautiful-sm mx-auto mb-6">
              <Mascot pose="empty" size={80} />
            </div>
            <p className="font-body-lg text-text-muted font-bold mb-2">No friends yet</p>
            <p className="font-body-md text-text-muted">Add some friends to get started!</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {friends.map((friend: any) => (
              <div key={friend.id} className="rounded-2xl bg-surface p-6 shadow-beautiful-md border border-surface-border hover:shadow-beautiful-lg transition-shadow duration-150">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xl shadow-beautiful-sm">
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
                    <form action={messageFriend.bind(null, friend.id)}>
                      <MessageButton />
                    </form>
                    <Link
                      href={`/profile/${friend.id}`}
                      className="font-label-sm font-bold bg-gradient-to-r from-pink-500 to-rose-500 text-white px-4 py-2 rounded-full shadow-lg border-2 border-white/30 hover:scale-105 transition-transform"
                    >
                      View
                    </Link>
                    <form action={removeFriendAction.bind(null, friend.id)}>
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
