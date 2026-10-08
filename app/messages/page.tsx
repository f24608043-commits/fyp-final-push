import { getConversations, getUnreadCount } from "../messaging/actions";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Mascot from "@/components/Mascot";
import Image from "next/image";

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

export default async function MessagesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect("/sign-in");
  }

  let conversations: any[] = [];
  let unreadCount = 0;

  try {
    const result = await Promise.all([
      getConversations(),
      getUnreadCount(),
    ]);
    conversations = result[0] || [];
    unreadCount = result[1] || 0;
  } catch (error) {
    console.error("Error loading conversations:", error);
    // Continue with empty state
  }

  return (
    <div className="w-full px-4 py-4 md:px-6 md:py-6 bg-gradient-to-br from-background via-tertiary/10 to-tertiary/10 min-h-screen">
      {/* Header */}
      <div className="relative w-full bg-tertiary rounded-2xl md:rounded-3xl p-1 shadow-clay-surface overflow-hidden mb-4 md:mb-6">
        <div className="absolute inset-0 rounded-2xl md:rounded-3xl border-4 border-dashed border-surface/40 pointer-events-none"></div>
        <div className="relative bg-surface/95 backdrop-blur-sm rounded-[20px] md:rounded-[24px] p-4 md:p-6 md:p-8">
          <div className="flex items-center justify-between gap-3 md:gap-4">
            <div className="flex items-center gap-2 md:gap-3">
              <span className="material-symbols-outlined text-text-primary text-[24px] md:text-[28px]" style={{ fontVariationSettings: 'FILL 1' }}>chat</span>
              <div>
                <h1 className="font-headline-lg md:font-headline-xl text-text-primary font-extrabold">Messages</h1>
                <p className="font-body-sm text-text-muted">
                  {unreadCount > 0 ? `${unreadCount} unread message${unreadCount > 1 ? 's' : ''}` : "All caught up!"}
                </p>
              </div>
            </div>
            <div className="w-12 h-12 md:w-16 md:h-16 shrink-0">
              <Mascot pose="idle" size={64} />
            </div>
          </div>
        </div>
      </div>

      {/* Conversations List */}
      {conversations.length === 0 ? (
        <div className="rounded-[20px] md:rounded-[24px] bg-surface p-6 md:p-8 text-center shadow-clay-surface border-4 border-surface/50">
          <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-xl bg-surface-border flex items-center justify-center overflow-hidden shadow-clay-surface mx-auto mb-4 border-4 border-surface/30">
            <Mascot pose="empty" size={64} />
          </div>
          <h3 className="font-headline-md text-headline-md text-text-primary font-extrabold mb-2">No conversations yet</h3>
          <p className="font-body-md text-text-muted">
            Start messaging tutors or friends to begin chatting!
          </p>
        </div>
      ) : (
        <div className="space-y-2 md:space-y-3">
          {conversations.map((item: any) => (
            <Link
              key={item.conversation.id}
              href={`/messages/${item.conversation.id}`}
              className="block"
            >
              <div className={`rounded-[20px] md:rounded-[24px] p-4 md:p-5 shadow-clay-surface border-4 transform hover:scale-[1.02] transition-transform duration-150 active:scale-[0.98] ${
                item.unreadCount > 0 
                  ? "bg-gradient-to-br from-surface to-tertiary/10 border-tertiary/30" 
                  : "bg-surface border-surface-border"
              }`}>
                <div className="flex items-start gap-3 md:gap-4">
                  {/* Avatar */}
                  <div className="shrink-0">
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
                         item.conversation.type === "group" ? "G" : "?"}
                      </div>
                    )}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className={`font-label-sm md:font-label-md font-semibold truncate ${
                        item.unreadCount > 0 ? "text-text-primary font-bold" : "text-text-primary"
                      }`}>
                        {item.conversation.type === "group" 
                          ? item.conversation.title 
                          : item.participant?.displayName || "Unknown User"}
                      </h3>
                      {item.unreadCount > 0 && (
                        <span className="shrink-0 ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-tertiary text-text-primary text-xs font-bold">
                          {item.unreadCount}
                        </span>
                      )}
                    </div>
                    
                    {item.lastMessage && (
                      <p className={`font-body-sm truncate ${
                        item.unreadCount > 0 ? "text-text-primary font-medium" : "text-text-muted"
                      }`}>
                        {item.lastMessage.body}
                      </p>
                    )}
                    
                    <p className="font-body-xs text-text-muted mt-1">
                      {item.conversation.lastMessageAt
                        ? getRelativeTime(new Date(item.conversation.lastMessageAt))
                        : "No messages yet"}
                    </p>
                  </div>
                  
                  {/* Join Class button for groups */}
                  {item.conversation.type === "group" && item.conversation.jitsiRoomId && (
                    <a
                      href={`https://meet.jit.si/${item.conversation.jitsiRoomId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="hidden md:shrink-0 md:inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-success to-primary text-text-primary px-3 py-2 font-label-sm font-bold shadow-clay-surface border-4 border-surface/30 transform hover:scale-105 transition-all active:scale-95"
                    >
                      <span className="material-symbols-outlined text-[18px]">videocam</span>
                      Join Class
                    </a>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
