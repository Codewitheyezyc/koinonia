"use client";

import { Sparkles } from "lucide-react";

interface SplashScreenProps {
  message?: string;
}

export default function SplashScreen({
  message = "Entering Sacred Sanctuary...",
}: SplashScreenProps) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 text-slate-100 p-6 animate-fade-in">
      <div className="text-center space-y-6 max-w-sm">
        {/* Animated Brand Logo */}
        <div className="relative inline-block">
          <div className="absolute -inset-4 bg-amber-500/20 rounded-full blur-xl animate-pulse" />
          <h1 className="relative font-serif text-4xl sm:text-5xl font-bold tracking-[0.2em] text-slate-50 uppercase">
            KOINONIA<span className="text-amber-500 font-extrabold animate-pulse">.</span>
          </h1>
        </div>

        {/* Subtitle */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-center gap-2 text-amber-400">
            <Sparkles className="w-5 h-5 animate-spin" />
            <span className="text-xs font-semibold uppercase tracking-widest">{message}</span>
          </div>

          {/* Glowing Animated Loading Bar */}
          <div className="w-48 h-1 bg-slate-900 rounded-full mx-auto overflow-hidden border border-slate-800 relative">
            <div className="h-full bg-gradient-to-r from-amber-600 via-amber-400 to-amber-500 rounded-full animate-pulse w-full" />
          </div>
        </div>

        <p className="text-[11px] text-slate-500 font-mono pt-4">
          100% Private • Ad-Free • Fellowship Centered
        </p>
      </div>
    </div>
  );
}
