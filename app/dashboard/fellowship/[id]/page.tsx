"use client";

import { use, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import DashboardNavbar from "@/components/DashboardNavbar";
import ChatChannel from "@/components/ChatChannel";
import PrayerRequestBoard from "@/components/PrayerRequestBoard";
import ScriptureNotesChannel from "@/components/ScriptureNotesChannel";
import MeetingRoomModal from "@/components/MeetingRoomModal";
import ScriptureReaderDrawer from "@/components/ScriptureReaderDrawer";
import MobileBottomNav from "@/components/MobileBottomNav";
import { Video, Loader2 } from "lucide-react";

export default function FellowshipDashboardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: fellowshipId } = use(params);
  const searchParams = useSearchParams();
  const selectedChannelId = searchParams.get("channel");

  const [fellowship, setFellowship] = useState<any>(null);
  const [channels, setChannels] = useState<any[]>([]);
  const [activeChannel, setActiveChannel] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isMeetingOpen, setIsMeetingOpen] = useState(false);
  const [isBibleOpen, setIsBibleOpen] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    async function loadFellowshipData() {
      setLoading(true);
      // Fetch fellowship info
      const { data: fData } = await supabase
        .from("fellowships")
        .select("*")
        .eq("id", fellowshipId)
        .single();

      setFellowship(fData);

      // Fetch channels
      const { data: cData } = await supabase
        .from("channels")
        .select("*")
        .eq("fellowship_id", fellowshipId)
        .order("created_at", { ascending: true });

      if (cData && cData.length > 0) {
        setChannels(cData);
        // Default to notes channel if no ?channel= parameter is specified
        const notesCh = cData.find((c) => c.type === "notes");
        const target = selectedChannelId
          ? cData.find((c) => c.id === selectedChannelId) || notesCh || cData[0]
          : notesCh || cData[0];
        setActiveChannel(target);
      }
      setLoading(false);
    }

    loadFellowshipData();
  }, [fellowshipId, selectedChannelId, supabase]);

  if (loading || !fellowship) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-950">
        <Loader2 className="w-7 h-7 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden">
      {/* Primary Clean Header */}
      <DashboardNavbar
        fellowshipName={fellowship.name}
        channelName={activeChannel?.name || "general-chat"}
        inviteCode={fellowship.invite_code}
        onOpenBible={() => setIsBibleOpen(true)}
      />

      {/* Secondary Gathering Action Sub-Header */}
      <div className="h-12 bg-slate-900/90 border-b border-slate-800/80 px-4 sm:px-6 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-serif capitalize text-slate-200">
            #{activeChannel?.name?.replace("-", " ") || "general chat"}
          </span>
        </div>

        <button
          onClick={() => setIsMeetingOpen(true)}
          className="flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-950/30 transition cursor-pointer"
        >
          <Video className="w-4 h-4 shrink-0" />
          <span>Gather & Pray</span>
        </button>
      </div>

      {/* Active Channel View */}
      <div className="flex-1 flex overflow-hidden">
        {activeChannel?.type === "prayer_board" ? (
          <PrayerRequestBoard fellowshipId={fellowshipId} />
        ) : activeChannel?.type === "notes" ? (
          <ScriptureNotesChannel channelId={activeChannel.id} channelName={activeChannel.name} />
        ) : (
          <ChatChannel channelId={activeChannel?.id} channelName={activeChannel?.name || "general-chat"} />
        )}
      </div>

      <MobileBottomNav
        fellowshipId={fellowshipId}
        channels={channels}
        activeChannelId={activeChannel?.id}
      />

      <MeetingRoomModal
        isOpen={isMeetingOpen}
        onClose={() => setIsMeetingOpen(false)}
        fellowshipId={fellowshipId}
        fellowshipName={fellowship.name}
      />

      <ScriptureReaderDrawer
        isOpen={isBibleOpen}
        onClose={() => setIsBibleOpen(false)}
        fellowshipId={fellowshipId}
      />
    </div>
  );
}
