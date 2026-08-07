"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Video, User, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import CreateFellowshipModal from "./CreateFellowshipModal";
import DeleteFellowshipModal from "./DeleteFellowshipModal";
import MeetingRecordingsModal from "./MeetingRecordingsModal";
import CellMenuModal from "./CellMenuModal";
import GuestBadge from "./GuestBadge";

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
      <header className="h-16 bg-slate-950/80 border-b border-slate-800/80 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-20 backdrop-blur-md">
        {/* Left: Clean Cell Name & Channel Tag with Breathing Space */}
        <div className="flex items-center gap-3 min-w-0">
          <h2 className="font-serif text-sm sm:text-lg font-bold text-slate-100 truncate tracking-wide">
            {fellowshipName}
          </h2>
          <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-slate-800/90 text-slate-400 font-mono hidden sm:inline-block">
            #{channelName.replace("-", " ")}
          </span>
        </div>

        {/* Right: Uncluttered Action Bar (Start Live Meeting + Avatar Profile Menu) */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Primary Action: Start Live Meeting */}
          {fellowshipId && (
            <Link
              href={`/meeting/${fellowshipId}`}
              title="Enter or Start Live Meeting"
              className="flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-950/30 transition cursor-pointer"
            >
              <Video className="w-4 h-4 text-slate-950" />
              <span>Start Live Meeting</span>
            </Link>
          )}

          {/* Clean Avatar Profile Button (Opens Modal with All Tools) */}
          <button
            onClick={() => setIsMenuModalOpen(true)}
            title="Cell Sanctuary Menu & Profile"
            className="flex items-center gap-2.5 p-1.5 sm:px-3 sm:py-1.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/50 transition group cursor-pointer shadow-md"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-500/20 to-amber-600/30 border border-amber-500/40 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0 group-hover:bg-amber-500 group-hover:text-slate-950 transition">
              {userProfile?.full_name?.charAt(0).toUpperCase() || <User className="w-3.5 h-3.5" />}
            </div>
            <span className="text-xs font-semibold text-slate-200 group-hover:text-slate-50 hidden md:inline-block max-w-[110px] truncate">
              {userProfile?.full_name || "Believer"}
            </span>
          </button>
        </div>
      </header>

      {/* Profile & Tools Consolidation Modal */}
      <CellMenuModal
        isOpen={isMenuModalOpen}
        onClose={() => setIsMenuModalOpen(false)}
        fellowshipId={fellowshipId}
        fellowshipName={fellowshipName}
        inviteCode={inviteCode}
        userProfile={userProfile}
        isHost={isHost}
        onOpenCreateCell={() => setIsCreateModalOpen(true)}
        onOpenDeleteCell={() => setIsDeleteModalOpen(true)}
        onOpenRecordings={() => setIsRecordingsModalOpen(true)}
        onOpenBible={onOpenBible}
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
