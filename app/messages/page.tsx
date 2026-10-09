import { getConversations, getUnreadCount } from "../messaging/actions";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Mascot from "@/components/Mascot";
import ConversationsRealtimeList from "./ConversationsRealtimeList";

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

      {/* Realtime Conversations List */}
      <ConversationsRealtimeList
        initialConversations={conversations}
        currentUserId={user.id}
      />
    </div>
  );
}
