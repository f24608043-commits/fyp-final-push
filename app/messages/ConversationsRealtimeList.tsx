"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { usePresence } from "@/hooks/usePresence";
import { createClient } from "@/utils/supabase/client";
import { getConversations, getUnreadCount } from "../messaging/actions";

// Helper function for relative time
function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

interface ConversationsRealtimeListProps {
  initialConversations: any[];
  currentUserId: string;
}

export default function ConversationsRealtimeList({
  initialConversations,
  currentUserId,
}: ConversationsRealtimeListProps) {
  const [conversations, setConversations] = useState<any[]>(initialConversations);
  const { isUserOnline } = usePresence({ id: currentUserId });

  // Listen for realtime message inserts across any user conversation
  useEffect(() => {
    if (!currentUserId) return;

    const supabase = createClient();
    const channel = supabase.channel(`user-conversations-${currentUserId}`);

    channel
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        async () => {
          // Re-fetch conversation list to get latest ordering and unread counts
          try {
            const updated = await getConversations();
            setConversations(updated);
          } catch (e) {
            console.error("Failed to update conversations in realtime:", e);
          }
        }
      )
      .subscribe();

    // Background sync safety net every 12 seconds
    const interval = setInterval(async () => {
      try {
        const updated = await getConversations();
        setConversations(updated);
      } catch (e) {}
    }, 12000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [currentUserId]);

  if (conversations.length === 0) {
    return (
      <div className="rounded-[20px] md:rounded-[24px] bg-surface p-6 md:p-8 text-center shadow-clay-surface border-4 border-surface/50">
        <h3 className="font-headline-md text-headline-md text-text-primary font-extrabold mb-2">No conversations yet</h3>
        <p className="font-body-md text-text-muted">
          Start messaging tutors or friends to begin chatting!
        </p>
      </div>
    );
  }

  const router = useRouter();

  return (
    <div className="space-y-2 md:space-y-3">
      {conversations.map((item: any) => {
        const participantId = item.participant?.id;
        const online = participantId ? isUserOnline(participantId) : false;
        const jitsiRoom = item.conversation.jitsiRoomId || `lego-chat-${item.conversation.id}`;

        return (
          <div
            key={item.conversation.id}
            role="button"
            tabIndex={0}
            onClick={() => router.push(`/messages/${item.conversation.id}`)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                router.push(`/messages/${item.conversation.id}`);
              }
            }}
            className="conversation-item block text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-tertiary/40 rounded-[20px] md:rounded-[24px]"
          >
            <div
              className={`rounded-[20px] md:rounded-[24px] p-4 md:p-5 shadow-clay-surface border-4 transform hover:scale-[1.01] transition-transform duration-150 active:scale-[0.99] ${
                item.unreadCount > 0
                  ? "bg-gradient-to-br from-surface to-tertiary/10 border-tertiary/30"
                  : "bg-surface border-surface-border"
              }`}
            >
              <div className="flex items-start gap-3 md:gap-4">
                {/* Avatar with Presence Dot */}
                <div className="relative shrink-0">
                  {item.participant?.avatarUrl ? (
                    <Image
                      src={item.participant.avatarUrl}
                      alt={item.participant.displayName || "User"}
                      width={48}
                      height={48}
                      className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover border-2 border-surface-border"
                    />
                  ) : (
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-tertiary flex items-center justify-center text-text-primary font-bold text-lg border-2 border-surface/30">
                      {item.participant?.displayName?.charAt(0).toUpperCase() ||
                        (item.conversation.type === "group" ? "G" : "?")}
                    </div>
                  )}

                  {/* Presence indicator for direct conversations */}
                  {item.conversation.type === "direct" && participantId && (
                    <span
                      className={`absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-surface ${
                        online ? "bg-success" : "bg-text-muted/40"
                      }`}
                      title={online ? "Online" : "Offline"}
                    />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <h3
                        className={`font-label-sm md:font-label-md font-semibold truncate ${
                          item.unreadCount > 0 ? "text-text-primary font-bold" : "text-text-primary"
                        }`}
                      >
                        {item.conversation.type === "group"
                          ? item.conversation.title
                          : item.participant?.displayName || "Unknown User"}
                      </h3>
                      {item.conversation.type === "direct" && (
                        <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                          online ? "bg-success/20 text-success" : "bg-surface-border text-text-muted"
                        }`}>
                          {online ? "Online" : "Offline"}
                        </span>
                      )}
                    </div>

                    {item.unreadCount > 0 && (
                      <span className="shrink-0 ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-tertiary text-text-primary text-xs font-bold">
                        {item.unreadCount}
                      </span>
                    )}
                  </div>

                  {item.lastMessage && (
                    <p
                      className={`font-body-sm truncate ${
                        item.unreadCount > 0 ? "text-text-primary font-medium" : "text-text-muted"
                      }`}
                    >
                      {item.lastMessage.body}
                    </p>
                  )}

                  <p className="font-body-xs text-text-muted mt-1">
                    {item.conversation.lastMessageAt
                      ? getRelativeTime(new Date(item.conversation.lastMessageAt))
                      : "No messages yet"}
                  </p>
                </div>

                {/* Independent Video Call Action */}
                <a
                  href={`https://meet.jit.si/${jitsiRoom}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  className="hidden md:shrink-0 md:inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-success to-primary text-text-primary px-3 py-1.5 font-label-sm font-bold shadow-clay-surface border-2 border-surface/30 transform hover:scale-105 transition-all active:scale-95 text-xs"
                  title="Start or join video call"
                >
                  <span className="material-symbols-outlined text-[16px]">videocam</span>
                  <span>Call</span>
                </a>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
