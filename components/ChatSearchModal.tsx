"use client";

import { useState } from "react";
import { Search, X, MessageSquare, Calendar, ArrowRight } from "lucide-react";
import { FormattedAuthorName } from "@/components/GuestBadge";

interface ChatSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  messages: any[];
  onSelectMessage: (messageId: string) => void;
}

export default function ChatSearchModal({
  isOpen,
  onClose,
  messages,
  onSelectMessage,
}: ChatSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState("");

  if (!isOpen) return null;

  const filtered = searchQuery.trim()
    ? messages.filter((m) =>
        m.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/80 backdrop-blur-md p-4 sm:p-6 pt-16 sm:pt-20 animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 max-h-[80vh] flex flex-col"
      >
        {/* Search Input Bar */}
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-amber-400 absolute left-3.5" />
          <input
            autoFocus
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search messages, scriptures, prayers, or member names..."
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-10 pr-10 py-3 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500/80 transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 p-1 text-slate-400 hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Results Stream */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {!searchQuery.trim() ? (
            <div className="text-center py-10 space-y-1 text-slate-500">
              <Search className="w-8 h-8 mx-auto text-amber-500/30 mb-2" />
              <p className="text-xs font-semibold text-slate-300">Search In-Chat Content</p>
              <p className="text-[11px] text-slate-400">
                Type keywords like scripture book names (*Romans, John*), prayer topics, or member names.
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-10 space-y-1 text-slate-500">
              <p className="text-xs font-semibold text-slate-300">No Matching Messages</p>
              <p className="text-[11px] text-slate-400">No results found for &quot;{searchQuery}&quot;</p>
            </div>
          ) : (
            filtered.map((msg) => (
              <div
                key={msg.id}
                onClick={() => {
                  onSelectMessage(msg.id);
                  onClose();
                }}
                className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-amber-500/40 hover:bg-slate-800/50 transition cursor-pointer flex items-start justify-between gap-3 group"
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-xs">
                    <FormattedAuthorName
                      name={msg.profiles?.full_name}
                      className="font-bold text-slate-200"
                    />
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(msg.created_at).toLocaleDateString()} at{" "}
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                    {msg.content}
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition shrink-0 mt-1" />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
