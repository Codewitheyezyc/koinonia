"use client";

import { useRef, useState, useEffect } from "react";
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { Minimize2, Maximize2, PhoneOff, Disc, Square, Loader2, AlertCircle } from "lucide-react";
import { useMeeting } from "@/lib/context/MeetingContext";
import GuestBadge from "@/components/GuestBadge";

const WORSHIP_REACTIONS = [
  { icon: "🔥", label: "Glory!", color: "text-amber-400" },
  { icon: "🙌", label: "Hallelujah!", color: "text-emerald-400" },
  { icon: "🙏", label: "Amen", color: "text-amber-300" },
  { icon: "❤️", label: "Praise God", color: "text-rose-400" },
  { icon: "🕊️", label: "Holy Spirit", color: "text-sky-300" },
  { icon: "👑", label: "King", color: "text-yellow-400" },
];

export default function FloatingMeetingRoom() {
  const { activeMeeting, isMinimized, isModalOpen, minimizeMeeting, maximizeMeeting, leaveMeeting } = useMeeting();
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [floatingReactions, setFloatingReactions] = useState<{ id: number; emoji: string; xPos: number }[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [egressId, setEgressId] = useState<string | null>(null);
  const [recordingLoading, setRecordingLoading] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // Reset error when meeting changes
  useEffect(() => {
    setConnectionError(null);
    setIsConnected(false);
  }, [activeMeeting?.fellowshipId]);

  if (!activeMeeting) return null;

  const triggerReaction = (emojiText: string) => {
    const id = Date.now();
    const xPos = Math.floor(Math.random() * 60) + 20;
    setFloatingReactions((prev) => [...prev, { id, emoji: emojiText, xPos }]);
    setTimeout(() => {
      if (mountedRef.current) {
        setFloatingReactions((prev) => prev.filter((r) => r.id !== id));
      }
    }, 2800);
  };

  const handleToggleRecording = async () => {
    if (recordingLoading) return;
    setRecordingLoading(true);
    try {
      if (isRecording && egressId) {
        await fetch("/api/livekit/record/stop", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ egressId, fellowshipId: activeMeeting.fellowshipId }),
        });
        setIsRecording(false);
        setEgressId(null);
      } else {
        const res = await fetch("/api/livekit/record/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fellowshipId: activeMeeting.fellowshipId }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setEgressId(data.egressId);
        setIsRecording(true);
      }
    } catch (err: any) {
      alert(err.message || "Recording action failed");
    } finally {
      setRecordingLoading(false);
    }
  };

  // MINIMIZED FLOATING BUBBLE — visible even when navigating
  if (isMinimized) {
    return (
      <div className="fixed bottom-20 md:bottom-6 right-4 z-50 flex flex-col items-end gap-2">
        <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl shadow-2xl shadow-emerald-950/40 overflow-hidden w-[220px]">
          {/* Mini Header */}
          <div className="px-3 py-2 bg-slate-950 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="text-[10px] font-bold text-slate-200 truncate">{activeMeeting.fellowshipName}</span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={maximizeMeeting}
                className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-amber-400 transition cursor-pointer"
                title="Open meeting"
              >
                <Maximize2 className="w-3 h-3" />
              </button>
              <button
                onClick={leaveMeeting}
                className="p-1 rounded bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white transition cursor-pointer"
                title="Leave meeting"
              >
                <PhoneOff className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Mini live indicator */}
          <div className="px-3 py-2 flex items-center justify-between gap-2 text-[10px]">
            <span className="font-semibold text-emerald-400">🎙️ Live Meeting Room</span>
            <GuestBadge size="xs" />
          </div>
        </div>
      </div>
    );
  }

  // FULL MEETING MODAL
  if (!isModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 backdrop-blur-md p-2 sm:p-4">
      <div className="w-full max-w-5xl h-[94vh] sm:h-[90vh] bg-slate-900 border border-slate-800 rounded-2xl flex flex-col overflow-hidden shadow-2xl relative">

        {/* Header */}
        <div className="px-4 sm:px-6 py-2.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${isConnected ? "bg-emerald-500 animate-pulse" : "bg-slate-600"}`} />
            <h3 className="font-serif text-xs sm:text-sm font-bold text-slate-100 truncate">
              {activeMeeting.fellowshipName} — Live Meeting Room
            </h3>
            {isRecording && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[10px] font-semibold uppercase animate-pulse shrink-0">
                <Disc className="w-2.5 h-2.5" /> REC
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Worship Reactions Bar */}
            <div className="flex items-center gap-0.5 bg-slate-900 border border-slate-800 px-1 py-1 rounded-xl">
              {WORSHIP_REACTIONS.map(({ icon, label, color }) => (
                <button
                  key={label}
                  onClick={() => triggerReaction(`${icon} ${label}`)}
                  title={label}
                  className={`px-1.5 py-1 rounded hover:bg-slate-800 text-[10px] sm:text-xs font-semibold ${color} transition cursor-pointer`}
                >
                  {icon}
                </button>
              ))}
            </div>

            {/* Record */}
            <button
              onClick={handleToggleRecording}
              disabled={recordingLoading || !isConnected}
              className={`flex items-center gap-1 px-2 py-1.5 rounded-lg border text-[11px] font-semibold transition cursor-pointer shrink-0 disabled:opacity-40 ${
                isRecording ? "bg-rose-950/60 border-rose-800 text-rose-300" : "bg-slate-900 border-slate-800 text-slate-300 hover:text-rose-400"
              }`}
            >
              {recordingLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : isRecording ? (
                <><Square className="w-3 h-3 fill-rose-400 text-rose-400" /><span className="hidden sm:inline">Stop</span></>
              ) : (
                <><Disc className="w-3 h-3 text-rose-500" /><span className="hidden sm:inline">Record</span></>
              )}
            </button>

            {/* Minimize */}
            <button
              onClick={minimizeMeeting}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-amber-400 text-[11px] font-semibold transition cursor-pointer shrink-0"
              title="Minimize — meeting stays active"
            >
              <Minimize2 className="w-3 h-3" />
              <span className="hidden sm:inline">Minimize</span>
            </button>

            {/* Leave */}
            <button
              onClick={leaveMeeting}
              className="flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-semibold transition cursor-pointer shrink-0"
            >
              <PhoneOff className="w-3 h-3" />
              <span className="hidden sm:inline">Leave</span>
            </button>
          </div>
        </div>

        {/* Floating Reactions */}
        <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
          {floatingReactions.map((r) => (
            <div
              key={r.id}
              style={{ left: `${r.xPos}%` }}
              className="absolute bottom-16 -translate-x-1/2 animate-bounce bg-slate-900/95 border border-amber-500/50 text-amber-300 px-3.5 py-1.5 rounded-full font-bold text-xs sm:text-sm shadow-2xl backdrop-blur-md transition-all duration-1000"
            >
              {r.emoji}
            </div>
          ))}
        </div>

        {/* LiveKit Frame */}
        <div className="flex-1 bg-slate-950 relative overflow-hidden">
          {connectionError ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-6">
              <AlertCircle className="w-10 h-10 text-rose-400" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-rose-400">Unable to Connect</p>
                <p className="text-xs text-slate-500 max-w-sm">{connectionError}</p>
              </div>
              <div className="flex gap-3">
                <button onClick={leaveMeeting} className="px-4 py-2 rounded-lg bg-slate-800 text-slate-200 text-xs font-medium cursor-pointer hover:bg-slate-700">
                  Close
                </button>
              </div>
            </div>
          ) : (
            <LiveKitRoom
              video={true}
              audio={true}
              token={activeMeeting.token}
              serverUrl={activeMeeting.wsUrl}
              data-lk-theme="default"
              style={{ height: "100%" }}
              options={{ adaptiveStream: true, dynacast: true }}
              onConnected={() => { if (mountedRef.current) setIsConnected(true); }}
              onDisconnected={(reason) => {
                if (mountedRef.current) {
                  setIsConnected(false);
                  if (reason === 0) leaveMeeting();
                }
              }}
              onError={(err) => {
                console.error("LiveKit error:", err);
                if (mountedRef.current) {
                  setConnectionError(err.message || "Connection failed. Check LiveKit environment variables.");
                }
              }}
            >
              <VideoConference />
              <RoomAudioRenderer />
            </LiveKitRoom>
          )}
        </div>
      </div>
    </div>
  );
}
