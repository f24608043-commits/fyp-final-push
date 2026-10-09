import { createClient } from "@/utils/supabase/client";
import { RealtimeChannel } from "@supabase/supabase-js";

export interface RealtimeMessagePayload {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
}

export interface UserPresenceState {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  role?: string;
  onlineAt: string;
}

/**
 * Subscribes to real-time messages in a specific conversation
 */
export function subscribeToConversation(
  conversationId: string,
  onNewMessage: (message: RealtimeMessagePayload) => void,
  onTyping?: (user: { userId: string; isTyping: boolean }) => void
): { channel: RealtimeChannel; unsubscribe: () => void } {
  const supabase = createClient();
  const channelName = `conversation-${conversationId}`;

  const channel = supabase.channel(channelName, {
    config: {
      broadcast: { self: false },
    },
  });

  // Listen to Postgres INSERT changes on messages table
  channel.on(
    "postgres_changes",
    {
      event: "INSERT",
      schema: "public",
      table: "messages",
      filter: `conversation_id=eq.${conversationId}`,
    },
    (payload) => {
      if (payload.new) {
        onNewMessage(payload.new as RealtimeMessagePayload);
      }
    }
  );

  // Listen for broadcast typing events
  if (onTyping) {
    channel.on("broadcast", { event: "typing" }, (payload) => {
      if (payload.payload) {
        onTyping(payload.payload);
      }
    });
  }

  channel.subscribe((status) => {
    console.log(`[Realtime] Conversation ${conversationId} status:`, status);
  });

  return {
    channel,
    unsubscribe: () => {
      supabase.removeChannel(channel);
    },
  };
}

/**
 * Broadcasts a typing status event to conversation participants
 */
export function broadcastTyping(channel: RealtimeChannel, userId: string, isTyping: boolean) {
  return channel.send({
    type: "broadcast",
    event: "typing",
    payload: { userId, isTyping },
  });
}

/**
 * Subscribes to notifications for a specific user
 */
export function subscribeToUserNotifications(
  userId: string,
  onNotification: (notification: any) => void
): () => void {
  const supabase = createClient();
  const channel = supabase.channel(`notifications-${userId}`);

  channel
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        if (payload.new) {
          onNotification(payload.new);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Subscribes to friendship changes (requests, acceptances) for a user
 */
export function subscribeToFriendships(
  userId: string,
  onFriendshipChange: (friendship: any) => void
): () => void {
  const supabase = createClient();
  const channel = supabase.channel(`friendships-${userId}`);

  // When someone sends a friend request or updates friendship
  channel
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "friendships",
      },
      (payload) => {
        const row = (payload.new || payload.old) as any;
        if (row && (row.requester_id === userId || row.addressee_id === userId)) {
          onFriendshipChange(payload.new || payload.old);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Subscribes to session request & booking status changes
 */
export function subscribeToUserSessions(
  userId: string,
  onSessionChange: (session: any) => void
): () => void {
  const supabase = createClient();
  const channel = supabase.channel(`sessions-${userId}`);

  channel
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "session_requests",
      },
      (payload) => {
        const row = (payload.new || payload.old) as any;
        if (row && (row.learner_id === userId || row.tutor_id === userId)) {
          onSessionChange(payload.new || payload.old);
        }
      }
    )
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "tutor_sessions",
      },
      (payload) => {
        const row = (payload.new || payload.old) as any;
        if (row && (row.learner_id === userId || row.tutor_id === userId)) {
          onSessionChange(payload.new || payload.old);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
