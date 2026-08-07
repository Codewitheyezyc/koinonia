"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Copy, Check, BookOpen, User, Plus, Trash2, Video, Share2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import CreateFellowshipModal from "./CreateFellowshipModal";
import DeleteFellowshipModal from "./DeleteFellowshipModal";
import MeetingRecordingsModal from "./MeetingRecordingsModal";
import CellMenuModal from "./CellMenuModal";

interface DashboardNavbarProps {
  fellowshipId?: string;
  fellowshipName?: string;
  channelName?: string;
  inviteCode?: string;
  onOpenBible?: () => void;
}

export default function DashboardNavbar({
  fellowshipId,
  fellowshipName = "Cell Ministry",
  channelName = "general-chat",
  inviteCode,
  onOpenBible,
}: DashboardNavbarProps) {
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [copiedMeeting, setCopiedMeeting] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isHost, setIsHost] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isRecordingsModalOpen, setIsRecordingsModalOpen] = useState(false);
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function loadUserAndPermissions() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", user.id)
        .single();

      setUserProfile(profile || { full_name: user.email?.split("@")[0] });

      if (fellowshipId) {
        const { data: fData } = await supabase
          .from("fellowships")
          .select("created_by")
          .eq("id", fellowshipId)
          .single();

        if (fData?.created_by === user.id) {
          setIsHost(true);
        } else {
          const { data: member } = await supabase
            .from("fellowship_members")
            .select("role")
            .eq("fellowship_id", fellowshipId)
            .eq("user_id", user.id)
            .maybeSingle();
          if (member?.role === "host") setIsHost(true);
        }
      }
    }
    loadUserAndPermissions();
  }, [fellowshipId, supabase]);

  const copyCellInvite = () => {
    if (!inviteCode) return;
    const link = `${window.location.origin}/join/${inviteCode}`;
    navigator.clipboard.writeText(link);
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 2000);
  };

  const copyMeetingLink = () => {
    if (!fellowshipId) return;
    const link = `${window.location.origin}/meeting/${fellowshipId}`;
    navigator.clipboard.writeText(link);
    setCopiedMeeting(true);
    setTimeout(() => setCopiedMeeting(false), 2000);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const handleFellowshipCreated = (newId: string) => {
    setIsCreateModalOpen(false);
    router.push(`/dashboard/fellowship/${newId}`);
  };

  const handleFellowshipDeleted = () => {
    setIsDeleteModalOpen(false);
    router.push("/dashboard");
    router.refresh();
  };

  return (
    <>
      <header className="h-16 bg-slate-950/80 border-b border-slate-800/80 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20 backdrop-blur-md">
        {/* Left: Clean Cell Name & Channel Tag with Breathing Space */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 max-w-[150px] xs:max-w-[200px] sm:max-w-none">
          <h2 className="font-serif text-sm sm:text-base font-bold text-slate-100 truncate tracking-wide">
            {fellowshipName}
          </h2>
          <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-slate-800/90 text-slate-400 font-mono hidden sm:inline-block">
            #{channelName.replace("-", " ")}
          </span>
        </div>

        {/* Right: Direct Header Action Buttons & Avatar Profile Menu */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Parallel Scripture Reader Button */}
          {onOpenBible && (
            <button
              onClick={onOpenBible}
              title="Parallel Scripture Reader"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-amber-400 hover:border-amber-500/40 text-xs font-medium transition cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span className="hidden md:inline">Scripture Reader</span>
            </button>
          )}

          {/* Copy Live Call Link Button */}
          {fellowshipId && (
            <button
              onClick={copyMeetingLink}
              title="Copy Live Call Link for Guests"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 text-xs font-semibold transition cursor-pointer"
            >
              {copiedMeeting ? <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : <Video className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
              <span className="hidden lg:inline">{copiedMeeting ? "Call Link Copied" : "Call Link"}</span>
            </button>
          )}

          {/* Copy Cell Invite Button */}
          {inviteCode && (
            <button
              onClick={copyCellInvite}
              title="Copy Permanent Cell Invite Link"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-amber-400 hover:border-amber-500/40 text-xs font-medium transition cursor-pointer"
            >
              {copiedInvite ? <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : <Share2 className="w-3.5 h-3.5 shrink-0" />}
              <span className="hidden lg:inline">{copiedInvite ? "Invite Copied" : "Cell Invite"}</span>
            </button>
          )}

          {/* Clean Avatar Profile Button (Opens Modal with Recordings, Cell Tools, and Sign Out) */}
          <button
            onClick={() => setIsMenuModalOpen(true)}
            title="Cell Sanctuary Menu & Profile"
            className="flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/50 transition group cursor-pointer shadow-md"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-500/20 to-amber-600/30 border border-amber-500/40 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0 group-hover:bg-amber-500 group-hover:text-slate-950 transition">
              {userProfile?.full_name?.charAt(0).toUpperCase() || <User className="w-3.5 h-3.5" />}
            </div>
            <span className="text-xs font-semibold text-slate-200 group-hover:text-slate-50 hidden md:inline-block max-w-[100px] truncate">
              {userProfile?.full_name || "Believer"}
            </span>
          </button>
        </div>
      </header>

      {/* Profile & Tools Modal */}
      <CellMenuModal
        isOpen={isMenuModalOpen}
        onClose={() => setIsMenuModalOpen(false)}
        fellowshipId={fellowshipId}
        fellowshipName={fellowshipName}
        userProfile={userProfile}
        isHost={isHost}
        onOpenCreateCell={() => setIsCreateModalOpen(true)}
        onOpenDeleteCell={() => setIsDeleteModalOpen(true)}
        onOpenRecordings={() => setIsRecordingsModalOpen(true)}
        onSignOut={handleSignOut}
      />

      {/* Creation Modal */}
      <CreateFellowshipModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={handleFellowshipCreated}
      />

      {/* Deletion Modal */}
      {isDeleteModalOpen && fellowshipId && (
        <DeleteFellowshipModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          fellowshipId={fellowshipId}
          fellowshipName={fellowshipName}
          onDeleted={handleFellowshipDeleted}
        />
      )}

      {/* Recordings Modal */}
      {isRecordingsModalOpen && fellowshipId && (
        <MeetingRecordingsModal
          isOpen={isRecordingsModalOpen}
          onClose={() => setIsRecordingsModalOpen(false)}
          fellowshipId={fellowshipId}
          fellowshipName={fellowshipName}
          isHost={isHost}
        />
      )}
    </>
  );
}
