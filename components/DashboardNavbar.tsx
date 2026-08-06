"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Copy, Check, BookOpen, User, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import CreateFellowshipModal from "./CreateFellowshipModal";

interface DashboardNavbarProps {
  fellowshipName?: string;
  channelName?: string;
  inviteCode?: string;
  onOpenBible?: () => void;
}

export default function DashboardNavbar({
  fellowshipName = "Fellowship Gathering",
  channelName = "general-chat",
  inviteCode,
  onOpenBible,
}: DashboardNavbarProps) {
  const [copied, setCopied] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function loadUserProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", user.id)
        .single();

      setUserProfile(profile || { full_name: user.email?.split("@")[0] });
    }
    loadUserProfile();
  }, [supabase]);

  const copyInvite = () => {
    if (!inviteCode) return;
    const link = `${window.location.origin}/join/${inviteCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFellowshipCreated = (newId: string) => {
    setIsCreateModalOpen(false);
    router.push(`/dashboard/fellowship/${newId}`);
  };

  return (
    <>
      <header className="h-16 bg-slate-950/80 border-b border-slate-800/80 px-3 sm:px-6 flex items-center justify-between sticky top-0 z-20 backdrop-blur-md">
        {/* Title Header */}
        <div className="flex items-center gap-2 sm:gap-3 max-w-[140px] xs:max-w-[180px] sm:max-w-none">
          <h2 className="font-serif text-xs sm:text-base font-bold text-slate-100 truncate tracking-wide">
            {fellowshipName}
          </h2>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono hidden sm:inline-block">
            #{channelName.replace("-", " ")}
          </span>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {/* Create New Fellowship Button (Always accessible on Mobile & Desktop) */}
          <button
            onClick={() => setIsCreateModalOpen(true)}
            title="Create New Fellowship"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-semibold transition cursor-pointer"
          >
            <Plus className="w-4 h-4 shrink-0 text-amber-400" />
            <span className="hidden sm:inline">New Fellowship</span>
          </button>

          {onOpenBible && (
            <button
              onClick={onOpenBible}
              title="Parallel Scripture Reader"
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-amber-400 hover:border-amber-500/40 text-xs font-medium transition cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-amber-500 shrink-0" />
              <span className="hidden sm:inline">Bible Reader</span>
            </button>
          )}

          {inviteCode && (
            <button
              onClick={copyInvite}
              title="Copy Invite Link"
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-amber-400 hover:border-amber-500/40 text-xs font-medium transition cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400 shrink-0" /> : <Copy className="w-4 h-4 shrink-0" />}
              <span className="hidden sm:inline">{copied ? "Invite Copied" : "Copy Invite"}</span>
            </button>
          )}

          {/* User Profile Avatar Link */}
          <Link
            href="/dashboard/profile"
            title="Profile Settings"
            className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 transition group cursor-pointer"
          >
            <div className="w-7 h-7 rounded-full bg-amber-600/20 border border-amber-500/40 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0 group-hover:bg-amber-500 group-hover:text-slate-950 transition">
              {userProfile?.full_name?.charAt(0).toUpperCase() || <User className="w-3.5 h-3.5" />}
            </div>
            <span className="text-xs font-medium text-slate-300 group-hover:text-slate-100 hidden md:inline-block max-w-[100px] truncate">
              {userProfile?.full_name || "Believer"}
            </span>
          </Link>
        </div>
      </header>

      <CreateFellowshipModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={handleFellowshipCreated}
      />
    </>
  );
}
