import { getFriendList, getPendingRequests, getSuggestedFriends, sendFriendRequest } from "./actions";
import { acceptFriendRequest, rejectFriendRequest, removeFriend } from "./actions";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Mascot from "@/components/Mascot";
import Link from "next/link";
import AddFriendButton from "./AddFriendButton";
import MessageButton from "./MessageButton";
import FriendsRealtimeView from "./FriendsRealtimeView";

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
    <div className="w-full px-6 py-6 bg-gradient-to-br from-background via-tertiary/10 to-error/10 min-h-screen">
      {/* Header with Mascot - Stitch Frame Style */}
      <div className="relative w-full bg-gradient-to-br from-tertiary via-error to-error rounded-3xl p-1 shadow-clay-surface overflow-hidden mb-6">
        <div className="absolute inset-0 rounded-3xl border-4 border-dashed border-surface/40 pointer-events-none"></div>
        <div className="relative bg-surface/95 backdrop-blur-sm rounded-[24px] p-6 md:p-8">

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          {/* Left: Header info */}
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-4 py-1 rounded-full bg-gradient-to-r from-tertiary to-error text-text-primary font-label-sm text-label-sm tracking-wider uppercase font-bold shadow-clay-surface border-2 border-surface/30">👥 Social Learning</span>
              <span className="text-text-muted text-label-sm">•</span>
              <span className="px-4 py-1 rounded-full bg-gradient-to-r from-error to-secondary text-text-primary font-label-sm text-label-sm font-bold shadow-clay-surface border-2 border-surface/30">Friends & Community</span>
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
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-tertiary to-error text-text-primary px-6 py-3 font-label-md font-bold shadow-clay-surface border-4 border-surface/30 transform hover:scale-105 transition-all active:scale-95 shrink-0"
          >
            <span className="material-symbols-outlined text-[20px]">person_add</span>
            Add Friend
          </Link>
        </div>
        </div>
      </div>

      {/* Realtime Friends & Requests View */}
      <FriendsRealtimeView
        currentUserId={user.id}
        initialFriends={friends}
        initialPendingRequests={pendingRequests}
        initialSuggestedFriends={suggestedFriends}
      />
    </div>
  );
}
