"use client";

import { Pin, X, ChevronRight } from "lucide-react";
import { FormattedAuthorName } from "@/components/GuestBadge";

interface PinnedMessageBannerProps {
  pinnedMessage: {
    id: string;
    content: string;
    senderName?: string;
  } | null;
  isHost?: boolean;
  onUnpin?: (messageId: string) => void;
  onJumpToMessage?: (messageId: string) => void;
}

export default function PinnedMessageBanner({
  pinnedMessage,
  isHost = false,
  onUnpin,
  onJumpToMessage,
}: PinnedMessageBannerProps) {
  if (!pinnedMessage) return null;

  return (
    <div className="mx-4 mt-2 px-3.5 py-2.5 bg-gradient-to-r from-amber-500/15 via-slate-900/90 to-amber-500/10 border border-amber-500/40 rounded-2xl flex items-center justify-between gap-3 shadow-lg backdrop-blur-md animate-in slide-in-from-top-1 duration-200">
      <div
        onClick={() => onJumpToMessage?.(pinnedMessage.id)}
        className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer group"
      >
        <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 shadow-sm border border-amber-500/30">
          <Pin className="w-3.5 h-3.5" />
        </div>
        <div className="space-y-0.5 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
              Pinned Word / Scripture Focus
            </span>
            {pinnedMessage.senderName && (
              <span className="text-[10px] text-slate-400">
                by <FormattedAuthorName name={pinnedMessage.senderName} className="font-semibold text-slate-300" />
              </span>
            )}
          </div>
          <p className="text-xs text-slate-200 truncate group-hover:text-amber-200 transition font-medium">
            {pinnedMessage.content}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {onJumpToMessage && (
          <button
            onClick={() => onJumpToMessage(pinnedMessage.id)}
            title="Jump to message"
            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-300 transition cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
        {isHost && onUnpin && (
          <button
            onClick={() => onUnpin(pinnedMessage.id)}
            title="Unpin message"
            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 transition cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
