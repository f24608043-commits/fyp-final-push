"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";

interface Message {
  id: string;
  content: string;
  createdAt: Date;
  sender: {
    id: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
}

interface MessagingWidgetProps {
  otherUserId: string;
  otherUserName: string;
  sessionId?: string;
}

export default function MessagingWidget({ otherUserId, otherUserName, sessionId }: MessagingWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/messaging/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otherUserId, sessionId }),
      });
      const data = await response.json();
      if (data.messages) {
        setMessages(data.messages);
      }
    } catch (error) {
      console.error("Failed to load messages:", error);
    } finally {
      setIsLoading(false);
    }
  }, [otherUserId, sessionId]);

  // Real-time subscription when widget is open
  useEffect(() => {
    if (!isOpen || !otherUserId) return;

    loadMessages();

    const supabase = createClient();
    const channel = supabase.channel(`widget-messages-${otherUserId}`);

    channel
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        () => {
          loadMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpen, otherUserId, loadMessages]);

  const handleSend = async () => {
    if (!message.trim() || isLoading) return;

    const tempMessage = message.trim();
    setMessage("");

    // Optimistic message
    const tempId = `temp-${Date.now()}`;
    const optimistic: Message = {
      id: tempId,
      content: tempMessage,
      createdAt: new Date(),
      sender: {
        id: "self",
        displayName: "You",
        avatarUrl: null,
      },
    };

    setMessages((prev) => [...prev, optimistic]);

    try {
      const response = await fetch("/api/messaging/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otherUserId, content: tempMessage, sessionId }),
      });
      const data = await response.json();
      if (data.success) {
        await loadMessages();
      } else {
        throw new Error(data.error || "Failed to send");
      }
    } catch (error: any) {
      console.error("Failed to send message:", error);
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setMessage(tempMessage); // Restore message
      alert(error.message || "Failed to send message. Please try again.");
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
  };

  if (!isOpen) {
    return (
      <button
        onClick={handleOpen}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-primary text-text-primary shadow-clay-primary flex items-center justify-center transform hover:scale-105 active:scale-95 transition-all z-40 border-4 border-surface/30"
        title={`Message ${otherUserName}`}
      >
        <span className="material-symbols-outlined text-[28px]">chat</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[500px] max-w-[calc(100vw-3rem)] max-h-[calc(100vh-3rem)] rounded-[24px] bg-surface shadow-clay-surface border-4 border-surface-border flex flex-col z-50 overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-tertiary/10 border-b border-surface-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-tertiary flex items-center justify-center text-text-primary font-bold shadow-clay-surface">
            {otherUserName[0]?.toUpperCase() || "?"}
          </div>
          <div>
            <h3 className="font-headline-sm text-text-primary font-bold">{otherUserName}</h3>
            <span className="text-[10px] text-text-muted">Direct Session Chat</span>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="text-text-muted hover:text-text-primary p-1 rounded-full hover:bg-surface-border transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading && messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <span className="text-text-muted text-sm">Loading messages...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center p-4">
            <span className="text-text-muted text-sm">No messages yet. Send a message to start!</span>
          </div>
        ) : (
          messages.map((m) => {
            const isSelf = m.sender.id === "self" || m.sender.displayName === "You";
            return (
              <div key={m.id} className={`flex ${isSelf ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-[18px] px-3.5 py-2 text-sm ${
                    isSelf
                      ? "bg-primary text-text-primary shadow-clay-primary rounded-tr-sm"
                      : "bg-surface-border text-text-primary shadow-clay-surface rounded-tl-sm"
                  }`}
                >
                  <p>{m.content}</p>
                  <span className="text-[10px] opacity-70 block text-right mt-1">
                    {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-surface-border bg-surface">
        <div className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 rounded-full border border-surface-border focus:border-primary focus:outline-none text-sm bg-background"
          />
          <button
            onClick={handleSend}
            disabled={!message.trim()}
            className="px-4 py-2 rounded-full bg-primary text-text-primary font-bold text-sm shadow-clay-primary disabled:opacity-50 transition-all hover:scale-105 active:scale-95"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
