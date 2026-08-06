"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface UnreadNotificationContextType {
  unreadChannels: Record<string, boolean>;
  unreadTypes: { chat: boolean; prayer: boolean; notes: boolean };
  markChannelAsRead: (channelId?: string, type?: string) => void;
}

const UnreadNotificationContext = createContext<UnreadNotificationContextType>({
  unreadChannels: {},
  unreadTypes: { chat: false, prayer: false, notes: false },
  markChannelAsRead: () => {},
});

export function UnreadNotificationProvider({ children }: { children: React.ReactNode }) {
  const [unreadChannels, setUnreadChannels] = useState<Record<string, boolean>>({});
  const [unreadTypes, setUnreadTypes] = useState({ chat: false, prayer: false, notes: false });
  const supabase = createClient();

  useEffect(() => {
    const channelId = `unread-realtime-${Math.random().toString(36).substring(2, 9)}`;
    const sub = supabase
      .channel(channelId)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const chId = payload.new.channel_id;
          if (chId) {
            setUnreadChannels((prev) => ({ ...prev, [chId]: true }));
            setUnreadTypes((prev) => ({ ...prev, chat: true, notes: true }));
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "prayer_requests" },
        () => {
          setUnreadTypes((prev) => ({ ...prev, prayer: true }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(sub);
    };
  }, [supabase]);

  const markChannelAsRead = (channelId?: string, type?: string) => {
    if (channelId) {
      setUnreadChannels((prev) => {
        const next = { ...prev };
        delete next[channelId];
        return next;
      });
    }
    if (type) {
      setUnreadTypes((prev) => ({ ...prev, [type]: false }));
    }
  };

  return (
    <UnreadNotificationContext.Provider
      value={{ unreadChannels, unreadTypes, markChannelAsRead }}
    >
      {children}
    </UnreadNotificationContext.Provider>
  );
}

export function useUnreadNotifications() {
  return useContext(UnreadNotificationContext);
}
