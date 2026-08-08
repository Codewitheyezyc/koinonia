"use client";

import { useState } from "react";
import { Sparkles, BookOpen, ChevronDown, ChevronUp, Share2, Check, Edit3 } from "lucide-react";
import EditDailyScriptureModal from "@/components/EditDailyScriptureModal";

interface DailyConfessionWidgetProps {
  onOpenBible?: () => void;
  isHost?: boolean;
}

const DEFAULT_SCRIPTURES = [
  {
    theme: "Kingdom Dominion & Authority",
    reference: "Romans 8:37 & 1 John 4:4",
    scripture: "Nay, in all these things we are more than conquerors through him that loved us. Ye are of God, little children, and have overcome them: because greater is he that is in you, than he that is in the world.",
    confession: "I am born of God, and I overcome the world! The Greater One lives on the inside of me. I walk in divine victory, strength, and dominion in every situation today!",
  },
  {
    theme: "Righteousness & Divine Wisdom",
    reference: "1 Corinthians 1:30 & Colossians 1:9",
    scripture: "Christ Jesus is made unto us wisdom, and righteousness, and sanctification, and redemption. Filled with the knowledge of His will in all wisdom and spiritual understanding.",
    confession: "Christ is my wisdom and righteousness. I make wise decisions, I walk in perfection, and the Spirit of God directs my steps in excellence always!",
  },
  {
    theme: "Grace & Supernatural Prosperity",
    reference: "2 Corinthians 9:8 & Philippians 4:19",
    scripture: "And God is able to make all grace abound toward you; that ye, always having all sufficiency in all things, may abound to every good work.",
    confession: "God's supernatural grace is multiplied in my life! I have all sufficiency in all things. I am a distributor of eternal blessings and the glorious gospel of Christ.",
  },
];

export default function DailyConfessionWidget({ onOpenBible, isHost = false }: DailyConfessionWidgetProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Pick today's index
  const dayIndex = new Date().getDate() % DEFAULT_SCRIPTURES.length;
  const [currentWord, setCurrentWord] = useState(DEFAULT_SCRIPTURES[dayIndex]);

  const handleShare = () => {
    const text = `📖 *Daily Scripture & Confession — Koinonia*\n\n"${currentWord.scripture}" — ${currentWord.reference}\n\n*Faith Declaration:*\n"${currentWord.confession}"`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <div className="mx-2 sm:mx-4 mt-2 bg-gradient-to-r from-amber-500/10 via-slate-900/90 to-amber-600/10 border border-amber-500/30 rounded-2xl p-2.5 sm:p-3.5 shadow-xl backdrop-blur-md transition">
        {/* Widget Header */}
        <div className="flex items-center justify-between gap-2">
          <div
            onClick={() => setIsExpanded((prev) => !prev)}
            className="flex items-center gap-2.5 min-w-0 cursor-pointer flex-1 select-none"
          >
            <div className="w-7 h-7 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0 shadow-sm">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0 space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                  Word of the Day
                </span>
                <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                  {currentWord.reference}
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-100 truncate">
                {currentWord.theme}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Host Edit Scripture Button */}
            {isHost && (
              <button
                type="button"
                onClick={() => setShowEditModal(true)}
                title="Leader Authority: Edit Word of the Day & Confession"
                className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Share / Copy */}
            <button
              onClick={handleShare}
              title="Copy Word of the Day to clipboard"
              className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
            </button>

            {/* Bible Reader */}
            {onOpenBible && (
              <button
                onClick={onOpenBible}
                title="Open full Bible Reader"
                className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Expand / Collapse */}
            <button
              onClick={() => setIsExpanded((prev) => !prev)}
              title={isExpanded ? "Collapse" : "Expand Scripture & Confession"}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Expanded Scripture & Declaration */}
        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-2.5 text-xs animate-in fade-in duration-200">
            {/* Scripture Verse */}
            <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 italic text-slate-300 font-serif leading-relaxed">
              &quot;{currentWord.scripture}&quot;
              <span className="block mt-1 font-sans font-bold text-[10px] text-amber-400 not-italic">
                — {currentWord.reference}
              </span>
            </div>

            {/* Faith Declaration */}
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-1">
              <span className="font-bold text-[10px] uppercase text-amber-300 flex items-center gap-1">
                👑 Faith Declaration
              </span>
              <p className="text-amber-100 font-medium leading-relaxed text-xs">
                {currentWord.confession}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Edit Word of the Day Modal for Host */}
      {showEditModal && (
        <EditDailyScriptureModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          currentTheme={currentWord}
          onSave={(updated) => setCurrentWord(updated)}
        />
      )}
    </>
  );
}
