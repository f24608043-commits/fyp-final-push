"use client";

import { useState, useEffect } from "react";
import { acceptFriendRequest, rejectFriendRequest, removeFriend, sendFriendRequest, getFriendList, getPendingRequests } from "./actions";
import { subscribeToFriendships } from "@/lib/realtime";
import { usePresence } from "@/hooks/usePresence";
import Link from "next/link";
import Mascot from "@/components/Mascot";

interface FriendsRealtimeViewProps {
  currentUserId: string;
  initialFriends: any[];
  initialPendingRequests: any[];
  initialSuggestedFriends: any[];
}

export default function FriendsRealtimeView({
  currentUserId,
  initialFriends,
  initialPendingRequests,
  initialSuggestedFriends,
}: FriendsRealtimeViewProps) {
  const [friends, setFriends] = useState<any[]>(initialFriends);
  const [pendingRequests, setPendingRequests] = useState<any[]>(initialPendingRequests);
  const [suggestedFriends, setSuggestedFriends] = useState<any[]>(initialSuggestedFriends);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const { isUserOnline } = usePresence({ id: currentUserId });

  // Real-time friendship subscription
  useEffect(() => {
    if (!currentUserId) return;

    const unsubscribe = subscribeToFriendships(currentUserId, async () => {
      try {
        const [updatedFriends, updatedPending] = await Promise.all([
          getFriendList(),
          getPendingRequests(),
        ]);
        setFriends(updatedFriends || []);
        setPendingRequests(updatedPending || []);
      } catch (err) {
        console.error("Error refreshing friends in realtime:", err);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [currentUserId]);

  const handleAccept = async (requestId: string) => {
    setProcessingId(requestId);
    // Optimistic removal from pending
    setPendingRequests((prev) => prev.filter((r) => r.id !== requestId));

    try {
      await acceptFriendRequest(requestId);
      const [updatedFriends, updatedPending] = await Promise.all([
        getFriendList(),
        getPendingRequests(),
      ]);
      setFriends(updatedFriends || []);
      setPendingRequests(updatedPending || []);
    } catch (error: any) {
      console.error("Accept friend error:", error);
      alert(error.message || "Failed to accept friend request");
      // Restore on error
      const updatedPending = await getPendingRequests();
      setPendingRequests(updatedPending || []);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (requestId: string) => {
    setProcessingId(requestId);
    setPendingRequests((prev) => prev.filter((r) => r.id !== requestId));

    try {
      await rejectFriendRequest(requestId);
    } catch (error: any) {
      console.error("Reject friend error:", error);
      alert(error.message || "Failed to reject friend request");
      const updatedPending = await getPendingRequests();
      setPendingRequests(updatedPending || []);
    } finally {
      setProcessingId(null);
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
    if (!confirm("Are you sure you want to remove this friend?")) return;

    setProcessingId(friendId);
    setFriends((prev) => prev.filter((f) => f.id !== friendId));

    try {
      await removeFriend(friendId);
    } catch (error: any) {
      console.error("Remove friend error:", error);
      alert(error.message || "Failed to remove friend");
      const updatedFriends = await getFriendList();
      setFriends(updatedFriends || []);
    } finally {
      setProcessingId(null);
    }
  };

  const handleSendRequest = async (userId: string) => {
    setProcessingId(userId);
    try {
      await sendFriendRequest(userId);
      setSuggestedFriends((prev) => prev.filter((s) => s.id !== userId));
      alert("Friend request sent!");
    } catch (error: any) {
      console.error("Send friend request error:", error);
      alert(error.message || "Failed to send friend request");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Pending Friend Requests */}
      {pendingRequests.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="inline-flex h-3 w-3 rounded-full bg-primary animate-pulse"></span>
            <h2 className="font-headline-md text-headline-md text-text-primary font-extrabold">
              Pending Requests ({pendingRequests.length})
            </h2>
          </div>
          <div className="space-y-4">
            {pendingRequests.map((request: any) => (
              <div
                key={request.id}
                className="rounded-[24px] bg-surface p-6 shadow-clay-surface border border-surface-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="relative">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xl shadow-clay-surface">
                      {request.requester?.displayName?.[0] || "?"}
                    </div>
                    {isUserOnline(request.requester?.id) && (
                      <span className="absolute bottom-0 right-0 h-4 w-4 rounded-full bg-success border-2 border-surface" title="Online" />
                    )}
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
                <div className="flex gap-3 shrink-0 w-full sm:w-auto">
                  <button
                    onClick={() => handleAccept(request.id)}
                    disabled={processingId === request.id}
                    className="flex-1 sm:flex-none rounded-full bg-primary text-text-primary px-6 py-2.5 font-label-md font-bold shadow-clay-surface hover:shadow-clay-primary transition-all disabled:opacity-50"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleReject(request.id)}
                    disabled={processingId === request.id}
                    className="flex-1 sm:flex-none rounded-full border-2 border-surface-border bg-surface text-text-muted px-6 py-2.5 font-label-md font-semibold hover:bg-surface-border transition-colors disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suggested Friends */}
      {suggestedFriends.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-secondary text-[24px]" style={{ fontVariationSettings: "FILL 1" }}>
              person_add
            </span>
            <h2 className="font-headline-md text-headline-md text-text-primary font-extrabold">
              People You May Know ({suggestedFriends.length})
            </h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {suggestedFriends.map((suggested: any) => (
              <div
                key={suggested.id}
                className="rounded-[24px] bg-surface p-6 shadow-clay-surface border border-surface-border hover:shadow-clay-primary transition-shadow duration-150 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="relative">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary/10 text-secondary font-bold text-xl shadow-clay-surface">
                        {suggested.displayName?.[0] || "?"}
                      </div>
                      {isUserOnline(suggested.id) && (
                        <span className="absolute bottom-0 right-0 h-4 w-4 rounded-full bg-success border-2 border-surface" title="Online" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-label-md text-text-primary font-semibold truncate">
                        {suggested.displayName || "Unknown User"}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        <span className="material-symbols-outlined text-secondary text-[16px]" style={{ fontVariationSettings: "FILL 1" }}>
                          stars
                        </span>
                        <span className="font-body-sm text-secondary font-bold">{suggested.xp} XP</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-surface-border">
                  <div className="flex items-center gap-1 font-body-sm text-text-muted">
                    <span className="material-symbols-outlined text-secondary text-[16px]" style={{ fontVariationSettings: "FILL 1" }}>
                      local_fire_department
                    </span>
                    <span className="font-bold text-secondary">{suggested.streakCount || 0} day streak</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleSendRequest(suggested.id)}
                      disabled={processingId === suggested.id}
                      className="px-4 py-2 rounded-full bg-gradient-to-r from-tertiary to-error text-text-primary text-xs font-bold shadow-clay-surface hover:scale-105 transition-all disabled:opacity-50"
                    >
                      Add Friend
                    </button>
                    <Link
                      href={`/profile/${suggested.id}`}
                      className="font-label-sm font-medium text-text-muted hover:text-primary transition-colors text-xs"
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
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-headline-md text-headline-md text-text-primary font-extrabold">
            My Friends ({friends.length})
          </h2>
          <span className="text-xs text-text-muted">
            {friends.filter((f) => isUserOnline(f.id)).length} Online Now
          </span>
        </div>

        {friends.length === 0 ? (
          <div className="rounded-[24px] bg-surface p-12 text-center shadow-clay-surface border border-surface-border">
            <div className="relative w-24 h-24 rounded-[24px] bg-surface-border flex items-center justify-center overflow-hidden shadow-clay-surface mx-auto mb-6">
              <Mascot pose="empty" size={80} />
            </div>
            <p className="font-body-lg text-text-muted font-bold mb-2">No friends yet</p>
            <p className="font-body-md text-text-muted">Add some friends to get started!</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {friends.map((friend: any) => {
              const online = isUserOnline(friend.id);
              return (
                <div
                  key={friend.id}
                  className="rounded-[24px] bg-surface p-6 shadow-clay-surface border border-surface-border hover:shadow-clay-primary transition-shadow duration-150 flex flex-col justify-between"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="relative">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xl shadow-clay-surface">
                        {friend.displayName?.[0] || "?"}
                      </div>
                      <span
                        className={`absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-surface ${
                          online ? "bg-success" : "bg-text-muted/40"
                        }`}
                        title={online ? "Online" : "Offline"}
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-label-md text-text-primary font-semibold truncate">
                          {friend.displayName || "Unknown User"}
                        </p>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          online ? "bg-success/20 text-success" : "bg-surface-border text-text-muted"
                        }`}>
                          {online ? "Online" : "Offline"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <span className="material-symbols-outlined text-secondary text-[16px]" style={{ fontVariationSettings: "FILL 1" }}>
                          stars
                        </span>
                        <span className="font-body-sm text-secondary font-bold">{friend.xp || 0} XP</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-surface-border">
                    <div className="flex items-center gap-1 font-body-sm text-text-muted">
                      <span className="material-symbols-outlined text-secondary text-[16px]" style={{ fontVariationSettings: "FILL 1" }}>
                        local_fire_department
                      </span>
                      <span className="font-bold text-secondary">{friend.streakCount || 0} day streak</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/messages`}
                        className="p-2 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-text-primary transition-colors"
                        title="Chat"
                      >
                        <span className="material-symbols-outlined text-[18px]">chat</span>
                      </Link>
                      <Link
                        href={`/profile/${friend.id}`}
                        className="font-label-sm font-bold bg-gradient-to-r from-tertiary to-error text-text-primary px-3 py-1.5 rounded-full shadow-clay-surface border-2 border-surface/30 hover:scale-105 transition-transform text-xs"
                      >
                        View
                      </Link>
                      <button
                        onClick={() => handleRemoveFriend(friend.id)}
                        disabled={processingId === friend.id}
                        className="text-xs text-error hover:text-error/80 transition-colors px-2 py-1"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
