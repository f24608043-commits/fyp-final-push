"use server";

import { db } from "@/db";
import { friendships, profiles, friendshipStatusEnum, friendStreaks, dailyActivityLog } from "@/db/schema";
import { eq, and, or, desc, inArray, gte, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { notifyFriendRequest, notifyFriendAccepted } from "@/app/notifications/actions";

export async function sendFriendRequest(addresseeId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user?.id) {
    throw new Error("You must be logged in to send friend requests");
  }

  const requesterId = user.id;

  // Prevent self-friending
  if (requesterId === addresseeId) {
    throw new Error("You cannot send a friend request to yourself");
  }

  // Check if friendship already exists
  const existing = await db
    .select()
    .from(friendships)
    .where(
      or(
        and(eq(friendships.requesterId, requesterId), eq(friendships.addresseeId, addresseeId)),
        and(eq(friendships.requesterId, addresseeId), eq(friendships.addresseeId, requesterId))
      )
    )
    .limit(1);

  if (existing.length > 0) {
    const friendship = existing[0];
    if (friendship.status === "accepted") {
      throw new Error("You are already friends with this user");
    }
    if (friendship.status === "pending") {
      throw new Error("A friend request already exists");
    }
    if (friendship.status === "blocked") {
      throw new Error("This friendship is blocked");
    }
  }

  // Rate limiting: Check recent requests (max 5 requests in last hour)
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recentRequests = await db
    .select({ count: friendships.id })
    .from(friendships)
    .where(
      and(
        eq(friendships.requesterId, requesterId),
        eq(friendships.status, "pending"),
        gte(friendships.createdAt, oneHourAgo)
      )
    );

  if (recentRequests.length >= 5) {
    throw new Error("Rate limit exceeded: Maximum 5 friend requests per hour");
  }

  // Rate limiting: Check pending requests count (max 10 pending requests)
  const pendingCount = await db
    .select({ count: friendships.id })
    .from(friendships)
    .where(
      and(
        eq(friendships.requesterId, requesterId),
        eq(friendships.status, "pending")
      )
    );

  if (pendingCount.length >= 10) {
    throw new Error("Rate limit exceeded: Maximum 10 pending friend requests");
  }

  // Create friend request
  await db.insert(friendships).values({
    requesterId,
    addresseeId,
    status: "pending",
  });

  // Send notification to addressee
  await notifyFriendRequest(requesterId, addresseeId);

  revalidatePath("/friends");
  revalidatePath("/profile/[userId]");
  return { success: true };
}

export async function acceptFriendRequest(friendshipId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user?.id) {
    throw new Error("You must be logged in to accept friend requests");
  }

  const userId = user.id;

  try {
    // Verify the user is the addressee
    const friendship = await db
      .select()
      .from(friendships)
      .where(eq(friendships.id, friendshipId))
      .limit(1);

    if (friendship.length === 0) {
      throw new Error("Friend request not found");
    }

    if (friendship[0].addresseeId !== userId) {
      throw new Error("You can only accept requests sent to you");
    }

    if (friendship[0].status !== "pending") {
      throw new Error("This request is no longer pending");
    }

    // Update friendship status
    await db
      .update(friendships)
      .set({ status: "accepted", updatedAt: new Date() })
      .where(eq(friendships.id, friendshipId));

    // Create friend streak entry
    await db.insert(friendStreaks).values({
      friendshipId: friendshipId,
      streakCount: 0,
      lastSharedDate: null,
    });

    // Send notification to requester
    await notifyFriendAccepted(friendship[0].requesterId, userId);

    // Automatically create a direct conversation between the two friends without redirect
    try {
      const { getOrCreateDirectConversation } = await import("../messaging/actions");
      await getOrCreateDirectConversation(friendship[0].requesterId);
    } catch (convoError) {
      console.warn("Could not auto-create direct conversation:", convoError);
      // Non-fatal, continuing
    }

    revalidatePath("/friends");
    revalidatePath("/profile/[userId]");
    revalidatePath("/messages");
    return { success: true };
  } catch (error: any) {
    console.error("Error accepting friend request:", error);
    throw new Error(error.message || "Failed to accept friend request. Please try again.");
  }
}

export async function rejectFriendRequest(friendshipId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user?.id) {
    throw new Error("You must be logged in to reject friend requests");
  }

  const userId = user.id;

  try {
    // Verify the user is the addressee
    const friendship = await db
      .select()
      .from(friendships)
      .where(eq(friendships.id, friendshipId))
      .limit(1);

    if (friendship.length === 0) {
      throw new Error("Friend request not found");
    }

    if (friendship[0].addresseeId !== userId) {
      throw new Error("You can only reject requests sent to you");
    }

    if (friendship[0].status !== "pending") {
      throw new Error("This request is no longer pending");
    }

    // Update friendship status
    await db
      .update(friendships)
      .set({ status: "rejected", updatedAt: new Date() })
      .where(eq(friendships.id, friendshipId));

    revalidatePath("/friends");
    revalidatePath("/profile/[userId]");
    return { success: true };
  } catch (error) {
    console.error("Error rejecting friend request:", error);
    throw new Error("Failed to reject friend request. Please try again.");
  }
}

export async function blockUser(targetUserId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user?.id) {
    throw new Error("You must be logged in to block users");
  }

  const userId = user.id;

  // Prevent self-blocking
  if (userId === targetUserId) {
    throw new Error("You cannot block yourself");
  }

  // Check if friendship exists
  const existing = await db
    .select()
    .from(friendships)
    .where(
      or(
        and(eq(friendships.requesterId, userId), eq(friendships.addresseeId, targetUserId)),
        and(eq(friendships.requesterId, targetUserId), eq(friendships.addresseeId, userId))
      )
    )
    .limit(1);

  if (existing.length > 0) {
    // Update existing friendship to blocked
    await db
      .update(friendships)
      .set({ status: "blocked", updatedAt: new Date() })
      .where(eq(friendships.id, existing[0].id));
  } else {
    // Create new blocked friendship
    await db.insert(friendships).values({
      requesterId: userId,
      addresseeId: targetUserId,
      status: "blocked",
    });
  }

  revalidatePath("/friends");
  revalidatePath("/profile/[userId]");
  return { success: true };
}

export async function getFriendList() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user?.id) {
    return [];
  }

  const userId = user.id;

  // Optimized: Get friend profiles in a single query with joins
  const friendProfiles = await db
    .select({
      id: profiles.id,
      displayName: profiles.displayName,
      xp: profiles.xp,
      streakCount: profiles.streakCount,
      avatarUrl: profiles.avatarUrl,
    })
    .from(profiles)
    .innerJoin(friendships, or(
      and(eq(friendships.requesterId, userId), eq(friendships.addresseeId, profiles.id)),
      and(eq(friendships.addresseeId, userId), eq(friendships.requesterId, profiles.id))
    ))
    .where(eq(friendships.status, "accepted"))
    .limit(50);

  return friendProfiles;
}

export async function getPendingRequests() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user?.id) {
    return [];
  }

  const userId = user.id;

  // Optimized: Get pending requests with requester profiles in a single query
  const pendingRequests = await db
    .select({
      id: friendships.id,
      requesterId: friendships.requesterId,
      createdAt: friendships.createdAt,
      profileId: profiles.id,
      requesterDisplayName: profiles.displayName,
      requesterAvatarUrl: profiles.avatarUrl,
    })
    .from(friendships)
    .innerJoin(profiles, eq(friendships.requesterId, profiles.id))
    .where(and(eq(friendships.addresseeId, userId), eq(friendships.status, "pending")))
    .limit(50);

  return pendingRequests.map((request) => ({
    id: request.id,
    requesterId: request.requesterId,
    createdAt: request.createdAt,
    requester: {
      id: request.profileId,
      displayName: request.requesterDisplayName,
      avatarUrl: request.requesterAvatarUrl,
    },
  }));
}

export async function removeFriend(friendshipId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user?.id) {
    throw new Error("You must be logged in to remove friends");
  }

  const userId = user.id;

  // Verify the user is part of this friendship
  const friendship = await db
    .select()
    .from(friendships)
    .where(eq(friendships.id, friendshipId))
    .limit(1);

  if (friendship.length === 0) {
    throw new Error("Friendship not found");
  }

  if (friendship[0].requesterId !== userId && friendship[0].addresseeId !== userId) {
    throw new Error("You can only remove friendships you are part of");
  }

  // Delete the friendship
  await db.delete(friendships).where(eq(friendships.id, friendshipId));

  revalidatePath("/friends");
  revalidatePath("/profile/[userId]");
  return { success: true };
}

export async function getSuggestedFriends() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user?.id) {
    return [];
  }

  const userId = user.id;

  // Get current user's XP and existing friendships with error handling
  let currentUser = null;
  let existingFriendships: any[] = [];
  
  try {
    [currentUser, existingFriendships] = await Promise.all([
      db
        .select({ xp: profiles.xp, role: profiles.role })
        .from(profiles)
        .where(eq(profiles.id, userId))
        .limit(1),
      db
        .select({
          requesterId: friendships.requesterId,
          addresseeId: friendships.addresseeId,
          status: friendships.status,
        })
        .from(friendships)
        .where(
          or(
            eq(friendships.requesterId, userId),
            eq(friendships.addresseeId, userId)
          )
        )
    ]);
  } catch (error) {
    console.error('Error fetching user data for friends suggestions:', error);
    // Fallback: continue with empty data
    currentUser = [{ xp: 0, role: 'learner' }];
    existingFriendships = [];
  }

  if (!currentUser) return [];

  // Build set of blocked/friend IDs
  const blockedOrFriendIds = new Set();
  existingFriendships.forEach((f) => {
    if (f.status === "blocked" || f.status === "accepted" || f.status === "pending") {
      blockedOrFriendIds.add(f.requesterId === userId ? f.addresseeId : f.requesterId);
    }
  });

  // Get suggested users - filter by same role as current user (learner with learners, tutor with tutors)
  const userRole = currentUser[0]?.role || 'learner';
  const suggestedUsers = await db
    .select({
      id: profiles.id,
      displayName: profiles.displayName,
      xp: profiles.xp,
      streakCount: profiles.streakCount,
      avatarUrl: profiles.avatarUrl,
      role: profiles.role,
    })
    .from(profiles)
    .where(eq(profiles.role, userRole as "learner" | "tutor" | "admin"))
    .orderBy(desc(profiles.xp))
    .limit(20); // Get more to filter

  // Filter and return top 5
  return suggestedUsers
    .filter((suggested) => suggested.id !== userId && !blockedOrFriendIds.has(suggested.id))
    .slice(0, 5);
}

// Update friend streaks - call this when a user completes a lesson
export async function updateFriendStreaks(userId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user?.id) {
    return;
  }

  const today = new Date().toISOString().split('T')[0];

  // Log today's activity for the user
  await db.insert(dailyActivityLog).values({
    userId,
    activityDate: today,
  }).onConflictDoNothing();

  // Get all accepted friendships for this user
  const userFriendships = await db
    .select()
    .from(friendships)
    .where(
      and(
        eq(friendships.status, "accepted"),
        or(eq(friendships.requesterId, userId), eq(friendships.addresseeId, userId))
      )
    );

  for (const friendship of userFriendships) {
    const friendId = friendship.requesterId === userId ? friendship.addresseeId : friendship.requesterId;

    // Check if friend also has activity today
    const [friendActivity] = await db
      .select({ count: dailyActivityLog.id })
      .from(dailyActivityLog)
      .where(
        and(
          eq(dailyActivityLog.userId, friendId),
          eq(dailyActivityLog.activityDate, today)
        )
      );

    if (friendActivity && Number(friendActivity.count) > 0) {
      // Both friends have activity today - update streak
      const [friendStreak] = await db
        .select()
        .from(friendStreaks)
        .where(eq(friendStreaks.friendshipId, friendship.id))
        .limit(1);

      if (friendStreak) {
        const lastSharedDate = friendStreak.lastSharedDate ? new Date(friendStreak.lastSharedDate).toISOString().split('T')[0] : null;
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const todayStr = new Date().toISOString().split('T')[0];

        if (lastSharedDate === yesterday) {
          // Consecutive day - increment streak
          await db
            .update(friendStreaks)
            .set({ 
              streakCount: friendStreak.streakCount + 1,
              lastSharedDate: todayStr,
              updatedAt: new Date()
            })
            .where(eq(friendStreaks.friendshipId, friendship.id));
        } else if (lastSharedDate !== todayStr) {
          // Not consecutive - reset to 1
          await db
            .update(friendStreaks)
            .set({ 
              streakCount: 1,
              lastSharedDate: todayStr,
              updatedAt: new Date()
            })
            .where(eq(friendStreaks.friendshipId, friendship.id));
        }
      }
    }
  }
}

// Get friend streak for a specific friendship
export async function getFriendStreak(friendshipId: string) {
  const [friendStreak] = await db
    .select()
    .from(friendStreaks)
    .where(eq(friendStreaks.friendshipId, friendshipId))
    .limit(1);

  return friendStreak || { streakCount: 0, lastSharedDate: null };
}
