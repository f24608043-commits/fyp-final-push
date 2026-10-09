"use client";

import { useState, useEffect } from "react";
import { getConversations, getUnreadCount } from "../messaging/actions";
import { createClient } from "@/utils/supabase/client";
import { redirect } from "next/navigation";
import Mascot from "@/components/Mascot";
import ConversationsRealtimeList from "./ConversationsRealtimeList";
import MessageThread from "./MessageThread";

export default function MessagesPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        redirect("/sign-in");
        return;
      }

      setCurrentUser(user);

      try {
        const [convData, unreadData] = await Promise.all([
          getConversations(),
          getUnreadCount(),
        ]);
        setConversations(convData || []);
        setUnreadCount(unreadData || 0);
      } catch (error) {
        console.error("Error loading conversations:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  return (
    <div className="w-full h-screen flex flex-col md:flex-row bg-gradient-to-br from-background via-tertiary/10 to-tertiary/10">
      {/* Left Sidebar - Conversation List */}
      <div className={`w-full md:w-[400px] lg:w-[450px] flex flex-col bg-surface border-r border-surface-border ${selectedConversation ? 'hidden md:flex' : 'flex'}`}>
        {/* Header */}
        <div className="bg-tertiary p-4 shadow-clay-surface shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-text-primary text-[28px]" style={{ fontVariationSettings: 'FILL 1' }}>chat</span>
              <div>
                <h1 className="font-headline-lg text-text-primary font-extrabold">Messages</h1>
                <p className="font-body-xs text-text-muted">
                  {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
                </p>
              </div>
            </div>
            <div className="w-10 h-10 shrink-0">
              <Mascot pose="idle" size={40} />
            </div>
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-4 border-tertiary"></div>
            </div>
          ) : (
            <ConversationsRealtimeList
              initialConversations={conversations}
              currentUserId={currentUser?.id}
              onSelectConversation={setSelectedConversation}
              selectedConversation={selectedConversation}
            />
          )}
        </div>
      </div>

      {/* Right Side - Chat View */}
      <div className={`flex-1 flex flex-col ${!selectedConversation ? 'hidden md:flex' : 'flex'}`}>
        {selectedConversation ? (
          <>
            {/* Mobile Back Button */}
            <button
              onClick={() => setSelectedConversation(null)}
              className="md:hidden bg-surface border-b border-surface-border px-4 py-3 flex items-center gap-2 text-text-primary"
            >
              <span className="material-symbols-outlined">arrow_back</span>
              <span className="font-label-sm font-semibold">Back</span>
            </button>
            <MessageThread conversationId={selectedConversation} />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-background via-tertiary/10 to-tertiary/10">
            <div className="text-center">
              <Mascot pose="idle" size={128} className="mx-auto mb-4" />
              <h2 className="font-headline-lg text-text-primary font-extrabold mb-2">
                Select a conversation
              </h2>
              <p className="font-body-md text-text-muted">
                Choose a chat from the left to start messaging
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
