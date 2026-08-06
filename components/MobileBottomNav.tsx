"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquare, Heart, BookOpen, User, Settings } from "lucide-react";
import { useUnreadNotifications } from "@/lib/context/UnreadNotificationContext";

interface MobileBottomNavProps {
  fellowshipId?: string;
  channels?: { id: string; name: string; type: string }[];
  activeChannelId?: string;
}

export default function MobileBottomNav({
  fellowshipId,
  channels = [],
  activeChannelId,
}: MobileBottomNavProps) {
  const pathname = usePathname();
  const { unreadChannels, unreadTypes, markChannelAsRead } = useUnreadNotifications();

  const chatChannel = channels.find((c) => c.type === "chat") || channels[0];
  const prayerChannel = channels.find((c) => c.type === "prayer_board");
  const notesChannel = channels.find((c) => c.type === "notes");

  const isChatActive = activeChannelId === chatChannel?.id || (!activeChannelId && chatChannel && pathname.includes("/fellowship/"));
  const isPrayerActive = activeChannelId === prayerChannel?.id;
  const isNotesActive = activeChannelId === notesChannel?.id;
  const isProfileActive = pathname === "/dashboard/profile";
  const isSettingsActive = pathname === "/dashboard/settings";

  const hasChatUnread = chatChannel ? unreadChannels[chatChannel.id] : unreadTypes.chat;
  const hasPrayerUnread = unreadTypes.prayer;
  const hasNotesUnread = notesChannel ? unreadChannels[notesChannel.id] : unreadTypes.notes;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-slate-950/95 border-t border-slate-800/90 flex items-center justify-around z-40 backdrop-blur-md px-1 shadow-2xl">
      {fellowshipId && chatChannel ? (
        <Link
          href={`/dashboard/fellowship/${fellowshipId}?channel=${chatChannel.id}`}
          onClick={() => markChannelAsRead(chatChannel.id, "chat")}
          className={`flex flex-col items-center justify-center gap-1 flex-1 h-full text-[10px] font-medium transition relative ${
            isChatActive && !isPrayerActive && !isNotesActive
              ? "text-amber-400 font-bold"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <div className="relative">
            <MessageSquare className={`w-5 h-5 ${isChatActive && !isPrayerActive && !isNotesActive ? "text-amber-400" : "text-slate-400"}`} />
            {hasChatUnread && !isChatActive && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse border border-slate-950" />
            )}
          </div>
          <span>Chat</span>
        </Link>
      ) : (
        <Link
          href="/dashboard"
          className="flex flex-col items-center justify-center gap-1 flex-1 h-full text-[10px] font-medium text-slate-400 hover:text-slate-200"
        >
          <MessageSquare className="w-5 h-5 text-slate-400" />
          <span>Home</span>
        </Link>
      )}

      {fellowshipId && prayerChannel && (
        <Link
          href={`/dashboard/fellowship/${fellowshipId}?channel=${prayerChannel.id}`}
          onClick={() => markChannelAsRead(undefined, "prayer")}
          className={`flex flex-col items-center justify-center gap-1 flex-1 h-full text-[10px] font-medium transition relative ${
            isPrayerActive ? "text-rose-400 font-bold" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <div className="relative">
            <Heart className={`w-5 h-5 ${isPrayerActive ? "text-rose-400" : "text-slate-400"}`} />
            {hasPrayerUnread && !isPrayerActive && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse border border-slate-950" />
            )}
          </div>
          <span>Prayers</span>
        </Link>
      )}

      {fellowshipId && notesChannel && (
        <Link
          href={`/dashboard/fellowship/${fellowshipId}?channel=${notesChannel.id}`}
          onClick={() => markChannelAsRead(notesChannel.id, "notes")}
          className={`flex flex-col items-center justify-center gap-1 flex-1 h-full text-[10px] font-medium transition relative ${
            isNotesActive ? "text-emerald-400 font-bold" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <div className="relative">
            <BookOpen className={`w-5 h-5 ${isNotesActive ? "text-emerald-400" : "text-slate-400"}`} />
            {hasNotesUnread && !isNotesActive && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse border border-slate-950" />
            )}
          </div>
          <span>Notes</span>
        </Link>
      )}

      <Link
        href="/dashboard/profile"
        className={`flex flex-col items-center justify-center gap-1 flex-1 h-full text-[10px] font-medium transition ${
          isProfileActive ? "text-amber-400 font-bold" : "text-slate-400 hover:text-amber-400"
        }`}
      >
        <User className={`w-5 h-5 ${isProfileActive ? "text-amber-400" : "text-slate-400"}`} />
        <span>Profile</span>
      </Link>

      <Link
        href="/dashboard/settings"
        className={`flex flex-col items-center justify-center gap-1 flex-1 h-full text-[10px] font-medium transition ${
          isSettingsActive ? "text-amber-400 font-bold" : "text-slate-400 hover:text-amber-400"
        }`}
      >
        <Settings className={`w-5 h-5 ${isSettingsActive ? "text-amber-400" : "text-slate-400"}`} />
        <span>Settings</span>
      </Link>
    </nav>
  );
}
