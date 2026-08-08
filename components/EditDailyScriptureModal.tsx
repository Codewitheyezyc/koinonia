"use client";

import { useState } from "react";
import { Sparkles, BookOpen, X, Check, Shield } from "lucide-react";

interface EditDailyScriptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: {
    theme: string;
    reference: string;
    scripture: string;
    confession: string;
  };
  onSave: (updated: {
    theme: string;
    reference: string;
    scripture: string;
    confession: string;
  }) => void;
}

export default function EditDailyScriptureModal({
  isOpen,
  onClose,
  currentTheme,
  onSave,
}: EditDailyScriptureModalProps) {
  const [theme, setTheme] = useState(currentTheme.theme);
  const [reference, setReference] = useState(currentTheme.reference);
  const [scripture, setScripture] = useState(currentTheme.scripture);
  const [confession, setConfession] = useState(currentTheme.confession);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!theme.trim() || !scripture.trim()) return;
    onSave({ theme, reference, scripture, confession });
    onClose();
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150"
      >
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2 text-amber-400 font-serif font-bold text-sm">
            <Shield className="w-4 h-4 text-amber-400" />
            <span>Leader Sanctuary Focus: Word of the Day</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          As Cell Leader, you have the authority to set today&apos;s spiritual focus, scripture verse, and faith declaration for all fellowship members.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3 pt-1">
          {/* Theme Title */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Spiritual Theme / Title
            </label>
            <input
              type="text"
              required
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              placeholder="e.g. Grace & Supernatural Prosperity"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
            />
          </div>

          {/* Scripture Reference */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Scripture Reference
            </label>
            <input
              type="text"
              required
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g. 2 Corinthians 9:8 & Philippians 4:19"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
            />
          </div>

          {/* Scripture Verse Text */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Scripture Verse
            </label>
            <textarea
              required
              rows={3}
              value={scripture}
              onChange={(e) => setScripture(e.target.value)}
              placeholder="Enter scripture passage..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition leading-relaxed"
            />
          </div>

          {/* Faith Declaration & Confession */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Faith Confession & Declaration
            </label>
            <textarea
              required
              rows={3}
              value={confession}
              onChange={(e) => setConfession(e.target.value)}
              placeholder="Enter declaration of faith for the brethren..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-slate-100 text-xs font-medium transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold text-xs shadow-md transition cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Publish Word of the Day</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
