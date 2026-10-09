"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { getMessages, sendMessage, markRead, leaveGroup } from "../messaging/actions";
import { createClient } from "@/utils/supabase/client";
import { subscribeToConversation, broadcastTyping } from "@/lib/realtime";
import { usePresence } from "@/hooks/usePresence";
import Image from "next/image";

interface Message {
  message: {
    id: string;
    body: string;
    createdAt: Date;
    status?: "sending" | "sent" | "error";
  };
  sender: {
    id: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
}

interface MessageThreadProps {
  conversationId: string;
}

export default function MessageThread({ conversationId }: MessageThreadProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [conversationType, setConversationType] = useState<"direct" | "group">("direct");
  const [jitsiRoomId, setJitsiRoomId] = useState<string | null>(null);
  const [otherParticipant, setOtherParticipant] = useState<{ displayName: string | null; avatarUrl: string | null; id: string } | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const channelRef = useRef<any>(null);

  // Presence hook
  const { isUserOnline } = usePresence(currentUser);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initial load
  useEffect(() => {
    let mounted = true;

    async function loadInitialData() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return;

        if (mounted) setCurrentUser(user);

        // Load messages
        const initialMessages = await getMessages(conversationId);
        if (mounted) {
          setMessages(initialMessages);
          setIsLoading(false);
        }

        // Fetch conversation details (type, jitsiRoomId)
        const { data: convData } = await supabase
          .from("conversations")
          .select("type, jitsi_room_id, title")
          .eq("id", conversationId)
          .single();

        if (convData && mounted) {
          setConversationType(convData.type || "direct");
          setJitsiRoomId(convData.jitsi_room_id || null);
        }

        // Fetch conversation participants
        const { data: members } = await supabase
          .from("conversation_members")
          .select("user_id")
          .eq("conversation_id", conversationId);

        if (members && members.length > 0 && mounted) {
          const otherUserId = members.find((m: any) => m.user_id !== user.id)?.user_id;
          
          if (otherUserId) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("id, display_name, avatar_url")
              .eq("id", otherUserId)
              .single();
            
            if (profile && mounted) {
              setOtherParticipant({
                displayName: profile.display_name || "User",
                avatarUrl: profile.avatar_url,
                id: profile.id,
              });
            }
          } else if (mounted) {
            setOtherParticipant({
              displayName: convData?.title || (convData?.type === "group" ? "Group Chat" : "Chat"),
              avatarUrl: null,
              id: conversationId,
            });
          }
        }

        // Mark as read
        await markRead(conversationId);
      } catch (error) {
        console.error("Error loading messages:", error);
        if (mounted) setIsLoading(false);
      }
    }

    loadInitialData();

    return () => {
      mounted = false;
    };
  }, [conversationId]);

  // Real-time message subscription & typing events
  useEffect(() => {
    if (!conversationId || !currentUser?.id) return;

    const { channel, unsubscribe } = subscribeToConversation(
      conversationId,
      (newMsgPayload) => {
        // When real-time message inserted
        setMessages((prev) => {
          // Deduplicate if already present
          if (prev.some((m) => m.message.id === newMsgPayload.id)) {
            return prev;
          }

          // If this message was our optimistic one, replace it
          const isFromSelf = newMsgPayload.sender_id === currentUser.id;
          const filtered = prev.filter((m) => !(m.message.id.startsWith("temp-") && isFromSelf && m.message.body === newMsgPayload.body));

          const incomingMsg: Message = {
            message: {
              id: newMsgPayload.id,
              body: newMsgPayload.body,
              createdAt: new Date(newMsgPayload.created_at),
              status: "sent",
            },
            sender: {
              id: newMsgPayload.sender_id,
              displayName: isFromSelf
                ? (currentUser.user_metadata?.display_name || currentUser.email)
                : (otherParticipant?.displayName || "Participant"),
              avatarUrl: isFromSelf
                ? currentUser.user_metadata?.avatar_url
                : (otherParticipant?.avatarUrl || null),
            },
          };

          return [...filtered, incomingMsg];
        });

        // Mark as read if from someone else
        if (newMsgPayload.sender_id !== currentUser.id) {
          markRead(conversationId).catch(() => {});
        }
      },
      ({ userId, isTyping: typingStatus }) => {
        if (userId !== currentUser.id) {
          setIsTyping(typingStatus);
        }
      }
    );

    channelRef.current = channel;

    // Background sync safety net (every 10s)
    const syncInterval = setInterval(async () => {
      try {
        const latest = await getMessages(conversationId);
        setMessages((prev) => {
          // If message counts match and no temporary messages, avoid re-render
          if (latest.length === prev.length && !prev.some(m => m.message.id.startsWith("temp-"))) {
            return prev;
          }
          return latest;
        });
      } catch (e) {
        // Ignore background polling errors
      }
    }, 10000);

    return () => {
      unsubscribe();
      clearInterval(syncInterval);
      channelRef.current = null;
    };
  }, [conversationId, currentUser?.id, otherParticipant?.displayName, otherParticipant?.avatarUrl]);

  // Handle typing status broadcast
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);

    if (channelRef.current && currentUser?.id) {
      broadcastTyping(channelRef.current, currentUser.id, true);

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        if (channelRef.current && currentUser?.id) {
          broadcastTyping(channelRef.current, currentUser.id, false);
        }
      }, 2000);
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() || isSending || !conversationId) return;

    const tempId = `temp-${Date.now()}`;
    const textToSend = newMessage.trim();
    setNewMessage("");
    setIsSending(true);

    if (channelRef.current && currentUser?.id) {
      broadcastTyping(channelRef.current, currentUser.id, false);
    }

    // Optimistic message update
    const optimisticMessage: Message = {
      message: {
        id: tempId,
        body: textToSend,
        createdAt: new Date(),
        status: "sending",
      },
      sender: {
        id: currentUser.id,
        displayName: currentUser.user_metadata?.display_name || currentUser.email,
        avatarUrl: currentUser.user_metadata?.avatar_url,
      },
    };

    setMessages((prev) => [...prev, optimisticMessage]);

    try {
      const result = await sendMessage(conversationId, textToSend);

      // Upgrade optimistic message to confirmed
      setMessages((prev) =>
        prev.map((m) =>
          m.message.id === tempId
            ? {
                ...m,
                message: {
                  ...m.message,
                  id: result.message?.id || m.message.id,
                  status: "sent",
                },
              }
            : m
        )
      );
    } catch (error: any) {
      console.error("Error sending message:", error);
      // Mark optimistic message with error
      setMessages((prev) =>
        prev.map((m) =>
          m.message.id === tempId
            ? {
                ...m,
                message: {
                  ...m.message,
                  status: "error",
                },
              }
            : m
        )
      );
      // Restore draft input so user doesn't lose text
      setNewMessage(textToSend);
      alert(error.message || "Failed to send message. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  const handleLeaveGroup = async () => {
    if (!confirm("Are you sure you want to leave this conversation?")) return;
    if (!conversationId) return;

    try {
      await leaveGroup(conversationId);
      window.location.href = "/messages";
    } catch (error: any) {
      console.error("Error leaving group:", error);
      alert(error.message || "Failed to leave group");
    }
  };

  const isOtherOnline = otherParticipant ? isUserOnline(otherParticipant.id) : false;
  const effectiveJitsiRoom = jitsiRoomId || `lego-chat-${conversationId}`;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-tertiary mx-auto mb-4"></div>
          <p className="text-text-muted">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* WhatsApp-style Header */}
      <div className="bg-surface border-b border-surface-border px-4 py-3 flex items-center justify-between shrink-0 shadow-clay-surface">
        <div className="flex items-center gap-3">
          {otherParticipant ? (
            <div className="flex items-center gap-3">
              <div className="relative">
                {otherParticipant.avatarUrl ? (
                  <Image
                    src={otherParticipant.avatarUrl}
                    alt={otherParticipant.displayName || "User"}
                    width={40}
                    height={40}
                    className="w-10 h-10 rounded-full object-cover border-2 border-surface-border shadow-clay-surface"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-tertiary flex items-center justify-center text-text-primary font-bold text-lg border-2 border-surface/30 shadow-clay-surface">
                    {otherParticipant.displayName?.charAt(0).toUpperCase() || "U"}
                  </div>
                )}
                {/* Live Online Badge */}
                <span
                  className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-surface ${
                    isOtherOnline ? "bg-success" : "bg-text-muted/40"
                  }`}
                  title={isOtherOnline ? "Online" : "Offline"}
                />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="font-headline-sm text-text-primary font-extrabold truncate">
                    {otherParticipant.displayName || "User"}
                  </h1>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    isOtherOnline ? "bg-success/20 text-success" : "bg-surface-border text-text-muted"
                  }`}>
                    {isOtherOnline ? "Online" : "Offline"}
                  </span>
                </div>
                <p className="font-label-xs text-text-muted">
                  {isTyping ? (
                    <span className="text-primary font-bold animate-pulse">Typing...</span>
                  ) : conversationType === "group" ? (
                    "Group Chat"
                  ) : (
                    "Direct Message"
                  )}
                </p>
              </div>
            </div>
          ) : (
            <div>
              <h1 className="font-headline-sm text-text-primary font-extrabold">
                {conversationType === "group" ? "Group Chat" : "Direct Message"}
              </h1>
            </div>
          )}
        </div>

        {/* Action Buttons: Video Call & Group Leave */}
        <div className="flex items-center gap-2">
          {/* Video Call Integration for both Direct & Group */}
          <a
            href={`https://meet.jit.si/${effectiveJitsiRoom}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-success to-primary text-text-primary px-3.5 py-2 font-label-sm font-bold shadow-clay-surface border-2 border-surface/30 transform hover:scale-105 transition-all active:scale-95 text-xs"
          >
            <span className="material-symbols-outlined text-[18px]">videocam</span>
            <span>{conversationType === "group" ? "Join Class" : "Video Call"}</span>
          </a>

          {conversationType === "group" && (
            <button
              onClick={handleLeaveGroup}
              className="text-error hover:text-error/80 font-label-sm font-semibold px-2 py-1 transition-colors"
            >
              Leave
            </button>
          )}
        </div>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-br from-background via-tertiary/10 to-tertiary/10">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-text-primary px-4">
            <p className="font-body-md text-center text-text-muted">No messages yet. Say hello to get started!</p>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-3">
            {messages.map((msg) => {
              const isSelf = msg.sender.id === currentUser?.id;
              return (
                <div
                  key={msg.message.id}
                  className={`flex ${isSelf ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] md:max-w-[70%] rounded-[20px] px-3.5 py-2.5 md:px-4 md:py-3 shadow-clay-surface ${
                      isSelf
                        ? "bg-tertiary text-text-primary rounded-tr-sm"
                        : "bg-surface border-2 border-surface-border rounded-tl-sm"
                    }`}
                  >
                    {!isSelf && (
                      <p className="font-label-sm font-semibold mb-1 text-primary">
                        {msg.sender.displayName || "Participant"}
                      </p>
                    )}
                    <p className="font-body-sm whitespace-pre-wrap break-words">{msg.message.body}</p>
                    <div className="flex items-center justify-end gap-1 mt-1 opacity-70">
                      <span className="font-body-xs text-[10px]">
                        {new Date(msg.message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      {isSelf && (
                        <span>
                          {msg.message.status === "sending" ? (
                            <span className="text-[10px]">⏳</span>
                          ) : msg.message.status === "error" ? (
                            <span className="text-[10px] text-error font-bold">⚠️</span>
                          ) : (
                            <span className="material-symbols-outlined text-[13px]">check</span>
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {isTyping && (
              <div className="flex justify-start">
                <div className="rounded-[20px] px-3 py-1.5 bg-surface border-2 border-surface-border text-text-muted text-xs italic">
                  {otherParticipant?.displayName || "Participant"} is typing...
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Message Input */}
      <div className="bg-surface border-t border-surface-border px-4 py-3 shrink-0">
        <div className="max-w-3xl mx-auto flex gap-3">
          <input
            type="text"
            value={newMessage}
            onChange={handleInputChange}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2.5 rounded-full border-2 border-surface-border focus:border-tertiary focus:outline-none text-sm md:text-base bg-background"
            disabled={isSending}
            maxLength={2000}
          />
          <button
            onClick={handleSend}
            disabled={!newMessage.trim() || isSending}
            className="px-4 md:px-6 py-2.5 md:py-3 rounded-full bg-tertiary text-text-primary font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-clay-surface hover:scale-105 active:scale-95 flex items-center justify-center"
            style={{ minWidth: "50px" }}
          >
            {isSending ? (
              <span className="animate-spin text-sm">⏳</span>
            ) : (
              <span className="material-symbols-outlined text-[20px]">send</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
