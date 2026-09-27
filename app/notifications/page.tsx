import { getNotifications, getUnreadCount, markAsRead, markAllAsRead, deleteNotification } from "./actions";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Mascot from "@/components/Mascot";

export default async function NotificationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect("/sign-in");
  }

  const [notifications, unreadCount] = await Promise.all([
    getNotifications(),
    getUnreadCount()
  ]);

  return (
    <div className="w-full px-6 py-6">
      {/* Header with Mascot */}
      <div className="relative w-full rounded-3xl bg-surface-container-lowest p-6 md:p-8 shadow-xl overflow-hidden mb-6">
        {/* Decorative background gradients */}
        <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-primary-fixed/25 blur-3xl pointer-events-none"></div>
        <div className="absolute -left-20 -bottom-20 w-72 h-72 rounded-full bg-tertiary-fixed/30 blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          {/* Left: Header info */}
          <div className="flex flex-col gap-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-0.5 rounded-lg bg-surface-container-highest text-on-surface-variant font-label-sm text-label-sm tracking-wider uppercase">Updates</span>
              <span className="text-outline text-label-sm">•</span>
              <span className="px-3 py-0.5 rounded-lg bg-primary-container/20 text-primary font-label-sm text-label-sm">Activity Feed</span>
            </div>
            <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight leading-none">
              Notifications
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">
              Stay updated with your learning progress and social activity
            </p>
          </div>

          {/* Right: Mascot */}
          <div className="w-full lg:w-auto flex flex-col sm:flex-row items-center lg:items-end justify-center gap-4 shrink-0 self-center lg:self-auto">
            <div className="relative max-w-xs bg-surface-container-lowest p-4 rounded-2xl shadow-lg border-b-4 border-surface-container-high order-2 sm:order-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-secondary text-[18px]" style={{ fontVariationSettings: 'FILL 1' }}>notifications</span>
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary">Stay Informed</span>
              </div>
              <p className="font-headline-md text-label-md text-on-surface font-bold leading-snug">
                "Never miss an achievement or friend activity!"
              </p>
            </div>
            <div className="relative w-28 h-28 md:w-32 md:h-32 shrink-0 order-1 sm:order-2">
              <Mascot pose="idle" size={128} />
            </div>
          </div>
        </div>
      </div>

      {/* Header Actions */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[24px]">notifications</span>
          <h2 className="font-headline-md text-headline-md text-on-surface font-extrabold">All Notifications</h2>
        </div>
        {unreadCount > 0 && (
          <div className="flex items-center gap-4">
            <span className="bg-error-container text-on-error-container px-3 py-1 rounded-full font-label-sm font-bold">
              {unreadCount} unread
            </span>
            <form action={async (formData: FormData) => {
              "use server";
              await markAllAsRead();
            }}>
              <button className="font-label-sm text-primary hover:underline font-bold">
                Mark all as read
              </button>
            </form>
          </div>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="rounded-2xl bg-surface-container-lowest p-12 text-center shadow-md">
          <div className="relative w-20 h-20 rounded-xl bg-surface-container flex items-center justify-center overflow-hidden shadow-inner mx-auto mb-4">
            <Mascot pose="empty" size={64} />
          </div>
          <h2 className="font-headline-xl text-headline-xl text-on-surface font-extrabold mb-2">No notifications yet</h2>
          <p className="font-body-md text-on-surface-variant">You're all caught up! Check back later for updates.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification: any) => (
            <div
              key={notification.id}
              className={`rounded-2xl bg-surface-container-lowest p-4 shadow-md ${
                !notification.isRead ? "border-l-4 border-l-primary" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">
                      {getNotificationIcon(notification.type)}
                    </span>
                    <h3 className={`font-label-md font-semibold ${!notification.isRead ? "text-primary" : "text-on-surface"}`}>
                      {notification.title}
                    </h3>
                  </div>
                  <p className="font-body-sm text-on-surface-variant mb-2">{notification.message}</p>
                  <p className="font-body-sm text-on-surface-variant opacity-75">
                    {new Date(notification.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  {!notification.isRead && (
                    <form action={async (formData: FormData) => {
                      "use server";
                      await markAsRead(notification.id);
                    }}>
                      <button className="font-label-sm text-primary hover:underline font-bold">
                        Mark read
                      </button>
                    </form>
                  )}
                  <form action={async (formData: FormData) => {
                    "use server";
                    await deleteNotification(notification.id);
                  }}>
                    <button className="font-label-sm text-error hover:text-error/80 font-medium">
                      Delete
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function getNotificationIcon(type: string): string {
  switch (type) {
    case "friend_request":
      return "👋";
    case "friend_accepted":
      return "🤝";
    case "badge_earned":
      return "🏆";
    case "streak_milestone":
      return "🔥";
    case "lesson_completed":
      return "✅";
    case "leaderboard_rank":
      return "📊";
    default:
      return "🔔";
  }
}
