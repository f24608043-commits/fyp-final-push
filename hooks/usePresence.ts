"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { RealtimeChannel } from "@supabase/supabase-js";

export interface PresenceUser {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  role?: string;
  onlineAt: string;
}

// ---------------------------------------------------------------------------
// Module-level singleton — all components on the same page share ONE channel.
// Supabase throws if .on("presence",...) is called after .subscribe() on a
// channel with the same key, which happened when multiple components each
// called usePresence() and created a duplicate subscription.
// ---------------------------------------------------------------------------
let _channel: RealtimeChannel | null = null;
let _subscriberCount = 0;
let _onlineUsers: Map<string, PresenceUser> = new Map();
const _listeners = new Set<(users: Map<string, PresenceUser>) => void>();

function notifyListeners() {
  const snapshot = new Map(_onlineUsers);
  _listeners.forEach((fn) => fn(snapshot));
}

function getOrCreateChannel(currentUser: {
  id: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  role?: string | null;
}) {
  if (_channel) return _channel;

  const supabase = createClient();
  _channel = supabase.channel("global-online-presence", {
    config: { presence: { key: currentUser.id } },
  });

  _channel
    .on("presence", { event: "sync" }, () => {
      const state = _channel!.presenceState();
      const users = new Map<string, PresenceUser>();
      Object.keys(state).forEach((key) => {
        const presences = state[key] as any[];
        if (presences && presences.length > 0) {
          users.set(key, presences[0] as PresenceUser);
        }
      });
      _onlineUsers = users;
      notifyListeners();
    })
    .on("presence", { event: "join" }, ({ key, newPresences }) => {
      if (newPresences && newPresences.length > 0) {
        _onlineUsers = new Map(_onlineUsers);
        _onlineUsers.set(key, newPresences[0] as unknown as PresenceUser);
        notifyListeners();
      }
    })
    .on("presence", { event: "leave" }, ({ key }) => {
      _onlineUsers = new Map(_onlineUsers);
      _onlineUsers.delete(key);
      notifyListeners();
    })
    .subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await _channel!.track({
          userId: currentUser.id,
          displayName: currentUser.displayName || "User",
          avatarUrl: currentUser.avatarUrl || undefined,
          role: currentUser.role || undefined,
          onlineAt: new Date().toISOString(),
        });
      }
    });

  return _channel;
}

function destroyChannel() {
  if (!_channel) return;
  const supabase = createClient();
  _channel.untrack().catch(() => {});
  supabase.removeChannel(_channel);
  _channel = null;
  _onlineUsers = new Map();
}

// ---------------------------------------------------------------------------
// Public hook — safe to call from any number of components simultaneously
// ---------------------------------------------------------------------------
export function usePresence(currentUser?: {
  id: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  role?: string | null;
} | null) {
  const [onlineUsers, setOnlineUsers] = useState<Map<string, PresenceUser>>(
    () => new Map(_onlineUsers)
  );

  useEffect(() => {
    if (!currentUser?.id) return;

    const listener = (users: Map<string, PresenceUser>) => setOnlineUsers(users);
    _listeners.add(listener);

    _subscriberCount++;
    getOrCreateChannel(currentUser);

    return () => {
      _listeners.delete(listener);
      _subscriberCount--;
      if (_subscriberCount <= 0) {
        destroyChannel();
        _subscriberCount = 0;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);

  const isUserOnline = useCallback(
    (userId: string) => onlineUsers.has(userId),
    [onlineUsers]
  );

  return {
    onlineUsers,
    isUserOnline,
    onlineCount: onlineUsers.size,
  };
}
