"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { BookOpen, Plus, Sparkles, Loader2, Bookmark, Share2 } from "lucide-react";

interface Note {
  id: string;
  channel_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles?: {
    full_name: string;
  };
}

export default function ScriptureNotesChannel({
  channelId,
  channelName,
}: {
  channelId: string;
  channelName: string;
}) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const supabase = createClient();

  const loadNotes = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);

    const { data, error } = await supabase
      .from("messages")
      .select("*, profiles:user_id(full_name)")
      .eq("channel_id", channelId)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setNotes(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadNotes();
  }, [channelId]);

  const handlePostNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || submitting || !currentUser) return;

    setSubmitting(true);
    try {
      const { error } = await supabase.from("messages").insert({
        channel_id: channelId,
        user_id: currentUser.id,
        content: inputText.trim(),
      });

      if (error) throw error;

      setInputText("");
      loadNotes();
    } catch (err: any) {
      console.error("Failed to post note:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-between h-full bg-slate-900/30 overflow-hidden pb-16 md:pb-0">
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="border-b border-slate-800/80 pb-4 space-y-1">
          <h2 className="font-serif text-base sm:text-xl font-bold text-slate-100 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>Bible Study & Scripture Notes</span>
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Share study outlines, key verse insights, and meeting summaries with your fellowship.
          </p>
        </div>

        {/* Notes Stream */}
        {loading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
          </div>
        ) : notes.length === 0 ? (
          <div className="p-8 sm:p-12 text-center border border-dashed border-slate-800 rounded-2xl space-y-2 text-slate-500">
            <Bookmark className="w-8 h-8 text-emerald-500/40 mx-auto" />
            <h3 className="font-serif text-sm font-semibold text-slate-400">No Study Notes Pinned</h3>
            <p className="text-xs max-w-sm mx-auto">
              Post your first scripture study note or sermon outline below.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {notes.map((note) => (
              <div
                key={note.id}
                className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-slate-800 text-amber-400 flex items-center justify-center font-bold text-[10px]">
                      {note.profiles?.full_name?.charAt(0).toUpperCase() || "U"}
                    </div>
                    <span className="text-xs font-semibold text-slate-300">
                      {note.profiles?.full_name || "Believer"}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {new Date(note.created_at).toLocaleDateString()}
                  </span>
                </div>

                <div className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans whitespace-pre-wrap">
                  {note.content}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Input Form */}
      <div className="p-3 sm:p-4 bg-slate-950 border-t border-slate-800/80">
        <form onSubmit={handlePostNote} className="space-y-2 max-w-4xl mx-auto">
          <textarea
            rows={2}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Share a scripture passage, reflection, or meeting note..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500/80 transition resize-none"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!inputText.trim() || submitting}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs transition disabled:opacity-40 cursor-pointer"
            >
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              <span>Post Study Note</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
