"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  X,
  BookOpen,
  Search,
  Bookmark,
  Check,
  Loader2,
  Sparkles,
  Share2,
} from "lucide-react";

interface ScriptureReaderDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  fellowshipId?: string;
}

const TRANSLATIONS = [
  { id: "NIV", name: "NIV - New International Version" },
  { id: "AMP", name: "AMP - Amplified Bible" },
  { id: "AMPC", name: "AMPC - Amplified Classic Edition" },
  { id: "NLT", name: "NLT - New Living Translation" },
  { id: "KJV", name: "KJV - King James Version" },
  { id: "WEB", name: "WEB - World English Bible" },
  { id: "BBE", name: "BBE - Bible in Basic English" },
];

export default function ScriptureReaderDrawer({
  isOpen,
  onClose,
  fellowshipId,
}: ScriptureReaderDrawerProps) {
  const [reference, setReference] = useState("John 3:16");
  const [searchQuery, setSearchQuery] = useState("John 3:16");
  const [translation, setTranslation] = useState("NIV");
  const [passageData, setPassageData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [pinning, setPinning] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const fetchPassage = async (refStr: string, transStr: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/bible/passage?reference=${encodeURIComponent(refStr)}&translation=${transStr}`);
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Passage not found");
      setPassageData(data);
    } catch (err: any) {
      setError(err.message || "Could not load passage");
      setPassageData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchPassage(reference, translation);
    }
  }, [isOpen, translation]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setReference(searchQuery.trim());
    fetchPassage(searchQuery.trim(), translation);
  };

  const handlePinVerseToNotes = async () => {
    if (!passageData || !fellowshipId || pinning) return;

    setPinning(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Find the notes channel for this fellowship
      const { data: notesChannel } = await supabase
        .from("channels")
        .select("id")
        .eq("fellowship_id", fellowshipId)
        .eq("type", "notes")
        .single();

      if (!notesChannel) throw new Error("Study notes channel not found");

      const formattedNote = `📖 **PINNED SCRIPTURE (${passageData.translation_name || translation})**\n*${passageData.reference}*\n\n"${passageData.text.trim()}"`;

      const { error: postErr } = await supabase.from("messages").insert({
        channel_id: notesChannel.id,
        user_id: user.id,
        content: formattedNote,
      });

      if (postErr) throw postErr;

      setPinned(true);
      setTimeout(() => setPinned(false), 3000);
    } catch (err: any) {
      console.error("Failed to pin verse:", err);
      alert(err.message || "Failed to pin verse to study notes");
    } finally {
      setPinning(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Sliding Drawer */}
      <aside className="relative z-50 w-full max-w-lg bg-slate-950 h-full border-l border-slate-800 flex flex-col justify-between shadow-2xl overflow-hidden">
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-500" />
            <h3 className="font-serif text-base font-bold text-slate-100">Parallel Scripture Reader</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Translation Bar */}
        <div className="p-4 bg-slate-900/30 border-b border-slate-800/80 space-y-3">
          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="e.g. John 3:16, Psalms 23, Romans 8"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>
            <button
              type="submit"
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium cursor-pointer"
            >
              Search
            </button>
          </form>

          {/* Translation Dropdown & Quick Switcher */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-slate-400">
            <span className="font-medium">Translation:</span>
            <select
              value={translation}
              onChange={(e) => setTranslation(e.target.value)}
              className="w-full sm:w-auto bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-amber-400 font-semibold focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              {TRANSLATIONS.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Passage Display Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-16 space-y-3 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
              <span className="text-xs">Fetching scripture in {translation}...</span>
            </div>
          ) : error ? (
            <div className="p-8 text-center border border-dashed border-slate-800 rounded-2xl text-slate-400 space-y-2">
              <BookOpen className="w-8 h-8 text-rose-400/40 mx-auto" />
              <p className="text-xs text-rose-300">{error}</p>
              <p className="text-[11px] text-slate-500">
                Try searching e.g. "John 3:16" or "Psalms 23".
              </p>
            </div>
          ) : passageData ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h4 className="font-serif text-lg font-bold text-slate-100">
                    {passageData.reference}
                  </h4>
                  <span className="text-[10px] text-amber-400 font-mono">
                    Translation: {passageData.translation_name || translation}
                  </span>
                </div>

                {fellowshipId && (
                  <button
                    onClick={handlePinVerseToNotes}
                    disabled={pinning}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-medium transition cursor-pointer"
                  >
                    {pinning ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : pinned ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Bookmark className="w-3.5 h-3.5" />
                    )}
                    <span>{pinned ? "Pinned to Notes" : "Pin Verse to Notes"}</span>
                  </button>
                )}
              </div>

              {/* Verses Stream */}
              <div className="space-y-3 text-sm leading-relaxed text-slate-200 font-serif">
                {passageData.verses ? (
                  passageData.verses.map((v: any) => (
                    <p key={v.verse} className="flex gap-2">
                      <sup className="text-amber-500 font-mono font-bold text-[10px] pt-1">
                        {v.verse}
                      </sup>
                      <span>{v.text}</span>
                    </p>
                  ))
                ) : (
                  <p>{passageData.text}</p>
                )}
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer info */}
        <div className="p-3 bg-slate-900/60 border-t border-slate-800/80 text-[10px] text-slate-500 text-center">
          Koinonia Parallel Scripture Engine • NIV, AMP, AMPC, NLT, KJV, WEB, BBE
        </div>
      </aside>
    </div>
  );
}
