"use client";

import { useState, useEffect, useRef } from "react";
import { getMessages, sendMessage, markRead, leaveGroup } from "../../messaging/actions";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import { redirect } from "next/navigation";
import Image from "next/image";

interface Message {
  message: {
    id: string;
    body: string;
    createdAt: Date;
  };
  sender: {
    id: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
}

export default function MessageThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [conversationType, setConversationType] = useState<"direct" | "group">("direct");
  const [jitsiRoomId, setJitsiRoomId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [otherParticipant, setOtherParticipant] = useState<{ displayName: string | null; avatarUrl: string | null; id: string } | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    let mounted = true;

    async function loadInitialData() {
      try {
        const resolvedParams = await params;
        setConversationId(resolvedParams.id);

        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          redirect("/sign-in");
          return;
        }

        setCurrentUser(user);

        // Load messages
        const initialMessages = await getMessages(resolvedParams.id);
        if (mounted) {
          setMessages(initialMessages);
          setIsLoading(false);
        }

        // Fetch conversation participants to show who we're messaging
        const { data: members, error: membersError } = await supabase
          .from("conversation_members")
          .select("user_id")
          .eq("conversation_id", resolvedParams.id);

        console.log("Conversation members:", members);
        console.log("Members error:", membersError);
        console.log("Current user ID:", user.id);

        if (membersError) {
          console.error("Error fetching conversation members:", membersError);
        }

        if (members && members.length > 0 && mounted) {
          const otherUserId = members.find((m: any) => m.user_id !== user.id)?.user_id;
          console.log("Other user ID:", otherUserId);
          
          if (otherUserId) {
            const { data: profile, error: profileError } = await supabase
              .from("profiles")
              .select("id, display_name, avatar_url")
              .eq("id", otherUserId)
              .single();
            
            console.log("Other user profile:", profile);
            console.log("Profile error:", profileError);
            
            if (profile && mounted) {
              setOtherParticipant({
                displayName: profile.display_name || "Unknown User",
                avatarUrl: profile.avatar_url,
                id: profile.id,
              });
            } else if (mounted) {
              console.error("Failed to load profile for user:", otherUserId, profileError);
              setOtherParticipant({
                displayName: "Unknown User",
                avatarUrl: null,
                id: otherUserId,
              });
            }
          } else if (mounted) {
            // No other participant found (group chat or self-conversation)
            console.warn("No other participant found in conversation");
            // For group chats, show conversation name instead
            const { data: conversation } = await supabase
              .from("conversations")
              .select("name, type")
              .eq("id", resolvedParams.id)
              .single();
            
            if (conversation && mounted) {
              setOtherParticipant({
                displayName: conversation.name || conversation.type === "group" ? "Group Chat" : "Unknown User",
                avatarUrl: null,
                id: resolvedParams.id,
              });
            }
          }
        } else if (mounted) {
          console.error("No members found for conversation:", resolvedParams.id);
          setOtherParticipant({
            displayName: "Unknown User",
            avatarUrl: null,
            id: resolvedParams.id,
          });
        }

        // Mark as read
        await markRead(resolvedParams.id);
      } catch (error) {
        console.error("Error loading messages:", error);
        if (mounted) setIsLoading(false);
      }
    }

    loadInitialData();

    return () => {
      mounted = false;
    };
  }, [params]);

  // Polling for new messages instead of real-time subscription
  useEffect(() => {
    if (!conversationId || !currentUser) return;

    const pollInterval = setInterval(async () => {
      try {
        const latestMessages = await getMessages(conversationId);
        setMessages(latestMessages);
        await markRead(conversationId);
      } catch (error) {
        console.error("Error polling for messages:", error);
      }
    }, 3000); // Poll every 3 seconds

    return () => {
      clearInterval(pollInterval);
    };
  }, [conversationId, currentUser]);

  const handleSend = async () => {
    if (!newMessage.trim() || isSending || !conversationId) return;

    setIsSending(true);
    const tempMessage = newMessage;
    setNewMessage("");

    const optimisticMessage: Message = {
      message: {
        id: "temp",
        body: tempMessage,
        createdAt: new Date(),
      },
      sender: {
        id: currentUser.id,
        displayName: currentUser.user_metadata.display_name || currentUser.email,
        avatarUrl: currentUser.user_metadata.avatar_url,
      },
    };

    setMessages((prev) => [...prev, optimisticMessage]);

    try {
      const result = await sendMessage(conversationId, tempMessage);
      console.log("Message sent successfully:", result);
      // Remove optimistic message and let Realtime handle the real one
      setMessages((prev) => prev.filter((m) => m.message.id !== "temp"));
    } catch (error: any) {
      console.error("Error sending message:", error);
      setMessages((prev) => prev.filter((m) => m.message.id !== "temp"));
      setNewMessage(tempMessage); // Restore the message so user can try again
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
      redirect("/messages");
    } catch (error: any) {
      console.error("Error leaving group:", error);
      alert(error.message || "Failed to leave group");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-tertiary mx-auto mb-4"></div>
          <p className="text-text-muted">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen flex flex-col bg-gradient-to-br from-background via-tertiary/10 to-tertiary/10">
      {/* Header */}
      <div className="bg-surface border-b border-surface-border px-4 py-3 md:px-6 md:py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 md:gap-3">
          <Link href="/messages" className="text-text-muted hover:text-text-muted">
            <span className="material-symbols-outlined text-[24px]">arrow_back</span>
          </Link>
          {otherParticipant ? (
            <div className="flex items-center gap-2 md:gap-3">
              {otherParticipant.avatarUrl ? (
                <Image
                  src={otherParticipant.avatarUrl}
                  alt={otherParticipant.displayName || "User"}
                  width={40}
                  height={40}
                  className="w-9 h-9 md:w-10 md:h-10 rounded-full object-cover border-2 border-surface-border"
                />
              ) : (
                <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-tertiary flex items-center justify-center text-text-primary font-bold text-lg border-2 border-surface/30">
                  {otherParticipant.displayName?.charAt(0).toUpperCase() || "U"}
                </div>
              )}
              <div className="min-w-0">
                <h1 className="font-headline-sm md:font-headline-md text-text-primary font-extrabold truncate">
                  {otherParticipant.displayName || "Unknown User"}
                </h1>
                <p className="font-label-xs md:font-label-sm text-text-muted">
                  {conversationType === "group" ? "Group Chat" : "Direct Message"}
                </p>
              </div>
            </div>
          ) : (
            <div>
              <h1 className="font-headline-sm md:font-headline-md text-text-primary font-extrabold">
                {conversationType === "group" ? "Group Chat" : "Direct Message"}
              </h1>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {conversationType === "group" && jitsiRoomId && (
            <a
              href={`https://meet.jit.si/${jitsiRoomId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-success to-primary text-text-primary px-4 py-2 font-label-sm font-bold shadow-clay-surface border-4 border-surface/30 transform hover:scale-105 transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-[18px]">videocam</span>
              Join Class
            </a>
          )}
          {conversationType === "group" && (
            <button
              onClick={handleLeaveGroup}
              className="text-error hover:text-error font-label-sm font-semibold"
            >
              Leave
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 md:p-6">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-text-primary px-4">
            <p className="font-body-md text-center">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-3 md:space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.message.id}
                className={`flex ${msg.sender.id === currentUser?.id ? "justify-end" : "justify-start"}`}
              >
                <div className={`max-w-[85%] md:max-w-[70%] rounded-[20px] px-3 py-2 md:px-4 md:py-3 ${
                  msg.sender.id === currentUser?.id
                    ? "bg-tertiary text-text-primary"
                    : "bg-surface border-2 border-surface-border shadow-clay-surface"
                }`}>
                  {msg.sender.id !== currentUser?.id && (
                    <p className="font-label-sm font-semibold mb-1">
                      {msg.sender.displayName || "Unknown"}
                    </p>
                  )}
                  <p className="font-body-sm">{msg.message.body}</p>
                  <p className="font-body-xs mt-1 opacity-70">
                    {new Date(msg.message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="bg-surface border-t border-surface-border px-4 py-3 md:px-6 md:py-4 shrink-0 pb-safe">
        <div className="max-w-3xl mx-auto flex gap-2 md:gap-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2.5 md:py-3 rounded-full border-2 border-surface-border focus:border-tertiary focus:outline-none text-sm md:text-base"
            disabled={isSending}
            maxLength={2000}
          />
          <button
            onClick={handleSend}
            disabled={!newMessage.trim() || isSending}
            className="px-4 md:px-6 py-2.5 md:py-3 rounded-full bg-tertiary text-text-primary font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <span className="material-symbols-outlined text-[20px]">send</span>
          </button>
        </div>
      </div>
    </div>
  );
}
