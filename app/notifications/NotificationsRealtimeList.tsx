"use client";

import { useState, useEffect } from "react";
import { markAsRead, markAllAsRead, deleteNotification, getNotifications } from "./actions";
import { subscribeToUserNotifications } from "@/lib/realtime";
import Mascot from "@/components/Mascot";

function getNotificationIcon(type: string): string {
  switch (type) {
    case "friend_request":
      return "👥";
    case "friend_accepted":
      return "🎉";
    case "badge_earned":
      return "🏆";
    case "streak_milestone":
      return "🔥";
    case "lesson_completed":
      return "⭐";
    case "leaderboard_rank":
      return "👑";
    default:
      return "📢";
  }
}

interface NotificationsRealtimeListProps {
  initialNotifications: any[];
  initialUnreadCount: number;
  userId: string;
}

export default function NotificationsRealtimeList({
  initialNotifications,
  initialUnreadCount,
  userId,
}: NotificationsRealtimeListProps) {
  const [notifications, setNotifications] = useState<any[]>(initialNotifications);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Real-time subscription to notifications
  useEffect(() => {
    if (!userId) return;

    const unsubscribe = subscribeToUserNotifications(userId, (newNotif) => {
      setNotifications((prev) => [newNotif, ...prev]);
      setUnreadCount((prev) => prev + 1);
    });

    return () => {
      unsubscribe();
    };
  }, [userId]);

  const handleMarkRead = async (id: string) => {
    setProcessingId(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      await markAsRead(id);
    } catch (e) {
      console.error("Mark read error:", e);
    } finally {
      setProcessingId(null);
    }
  };

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);

    try {
      await markAllAsRead();
    } catch (e) {
      console.error("Mark all read error:", e);
    }
  };

  const handleDelete = async (id: string) => {
    setProcessingId(id);
    const target = notifications.find((n) => n.id === id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (target && !target.isRead) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }

    try {
      await deleteNotification(id);
    } catch (e) {
      console.error("Delete notification error:", e);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div>
      {/* Header Actions */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[24px]">notifications</span>
          <h2 className="font-headline-md text-headline-md text-text-primary font-extrabold">All Notifications</h2>
        </div>
        {unreadCount > 0 && (
          <div className="flex items-center gap-4">
            <span className="bg-error text-text-primary px-3 py-1 rounded-full font-label-sm font-bold shadow-clay-surface text-xs">
              {unreadCount} unread
            </span>
            <button
              onClick={handleMarkAllRead}
              className="font-label-sm text-primary hover:underline font-bold"
            >
              Mark all as read
            </button>
          </div>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="rounded-[24px] bg-surface p-12 text-center shadow-clay-surface">
          <div className="relative w-20 h-20 rounded-xl bg-surface-border flex items-center justify-center overflow-hidden shadow-inner mx-auto mb-4">
            <Mascot pose="empty" size={64} />
          </div>
          <h2 className="font-headline-xl text-headline-xl text-text-primary font-extrabold mb-2">No notifications yet</h2>
          <p className="font-body-md text-text-muted">You're all caught up! Check back later for updates.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`rounded-[24px] bg-surface p-4 shadow-clay-surface transition-all ${
                !notification.isRead ? "border-l-4 border-l-primary bg-primary/5" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">{getNotificationIcon(notification.type)}</span>
                    <h3 className={`font-label-md font-semibold ${!notification.isRead ? "text-primary" : "text-text-primary"}`}>
                      {notification.title}
                    </h3>
                  </div>
                  <p className="font-body-sm text-text-muted mb-2">{notification.message}</p>
                  <p className="font-body-sm text-text-muted opacity-75 text-xs">
                    {new Date(notification.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {!notification.isRead && (
                    <button
                      onClick={() => handleMarkRead(notification.id)}
                      disabled={processingId === notification.id}
                      className="font-label-sm text-primary hover:underline font-bold text-xs"
                    >
                      Mark read
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(notification.id)}
                    disabled={processingId === notification.id}
                    className="font-label-sm text-error hover:text-error/80 font-medium text-xs ml-2"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
