"use client";

import { Sparkles } from "lucide-react";

interface GuestBadgeProps {
  className?: string;
  size?: "xs" | "sm" | "md";
}

export default function GuestBadge({ className = "", size = "xs" }: GuestBadgeProps) {
  const sizeClasses = {
    xs: "px-2 py-0.5 text-[9px] gap-1",
    sm: "px-2.5 py-0.5 text-[10px] gap-1",
    md: "px-3 py-1 text-xs gap-1.5",
  };

  const iconSizes = {
    xs: "w-2.5 h-2.5",
    sm: "w-3 h-3",
    md: "w-3.5 h-3.5",
  };

  return (
    <span
      className={`inline-flex items-center font-bold uppercase tracking-wider rounded-full bg-gradient-to-r from-amber-500/15 via-amber-400/20 to-amber-500/15 border border-amber-400/40 text-amber-300 shadow-sm shadow-amber-950/30 backdrop-blur-sm select-none ${sizeClasses[size]} ${className}`}
    >
      <Sparkles className={`${iconSizes[size]} text-amber-400 shrink-0`} />
      <span>Guest</span>
    </span>
  );
}

/**
 * Helper utility to render a user's display name with a stylized GuestBadge
 * whenever the name contains "(Guest)".
 */
export function FormattedAuthorName({
  name,
  className = "font-semibold text-slate-200 text-xs",
}: {
  name?: string;
  className?: string;
}) {
  const raw = name || "Believer";
  const isGuest = raw.includes("(Guest)") || raw.toLowerCase().includes("guest");
  const cleanName = raw.replace(/\s*\(Guest\)/gi, "").trim();

  return (
    <div className={`inline-flex items-center gap-1.5 flex-wrap ${className}`}>
      <span>{cleanName}</span>
      {isGuest && <GuestBadge size="xs" />}
    </div>
  );
}
