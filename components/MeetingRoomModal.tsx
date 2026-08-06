"use client";

import { useEffect, useState } from "react";
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { X, Mic, Video, PhoneOff, Sparkles, Heart, Loader2, Disc, Square } from "lucide-react";

interface MeetingRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  fellowshipId: string;
  fellowshipName: string;
}

export default function MeetingRoomModal({
  isOpen,
  onClose,
  fellowshipId,
  fellowshipName,
}: MeetingRoomModalProps) {
  const [token, setToken] = useState<string | null>(null);
  const [wsUrl, setWsUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [floatingReactions, setFloatingReactions] = useState<{ id: number; emoji: string }[]>([]);

  // Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [egressId, setEgressId] = useState<string | null>(null);
  const [recordingLoading, setRecordingLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !fellowshipId) return;

    async function fetchToken() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/livekit/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fellowshipId }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to join room");

        setToken(data.token);
        setWsUrl(data.wsUrl);
      } catch (err: any) {
        setError(err.message || "Failed to connect to prayer room");
      } finally {
        setLoading(false);
      }
    }

    fetchToken();
  }, [isOpen, fellowshipId]);

  if (!isOpen) return null;

  const triggerWorshipReaction = (emoji: string) => {
    const id = Date.now();
    setFloatingReactions((prev) => [...prev, { id, emoji }]);
    setTimeout(() => {
      setFloatingReactions((prev) => prev.filter((r) => r.id !== id));
    }, 2500);
  };

  const handleToggleRecording = async () => {
    if (recordingLoading) return;
    setRecordingLoading(true);

    try {
      if (isRecording && egressId) {
        // Stop recording
        await fetch("/api/livekit/record/stop", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ egressId, fellowshipId }),
        });
        setIsRecording(false);
        setEgressId(null);
      } else {
        // Start recording
        const res = await fetch("/api/livekit/record/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fellowshipId }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to start recording");

        setEgressId(data.egressId);
        setIsRecording(true);
      }
    } catch (err: any) {
      console.error("Recording action failed:", err);
      alert(err.message || "Recording action failed");
    } finally {
      setRecordingLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 backdrop-blur-md p-2 sm:p-6">
      <div className="w-full max-w-5xl h-[92vh] sm:h-[88vh] bg-slate-900 border border-slate-800 rounded-2xl flex flex-col overflow-hidden shadow-2xl relative">
        {/* Header Bar */}
        <div className="p-3 sm:px-6 bg-slate-950 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 max-w-[200px] sm:max-w-none truncate">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <h3 className="font-serif text-xs sm:text-sm font-bold text-slate-100 truncate whitespace-nowrap">
              {fellowshipName} — Prayer Sanctuary
            </h3>

            {isRecording && (
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[10px] font-semibold uppercase animate-pulse shrink-0">
                <Disc className="w-3 h-3 text-rose-500" /> REC • Archiving Call
              </span>
            )}
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2 overflow-x-auto">
            {/* Call Recording Toggle */}
            <button
              onClick={handleToggleRecording}
              disabled={recordingLoading}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg border text-[11px] sm:text-xs font-semibold transition cursor-pointer shrink-0 ${
                isRecording
                  ? "bg-rose-950/60 border-rose-800 text-rose-300 hover:bg-rose-900/80"
                  : "bg-slate-900 border-slate-800 text-slate-300 hover:text-rose-400 hover:border-rose-900"
              }`}
            >
              {recordingLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : isRecording ? (
                <>
                  <Square className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
                  <span>Stop Recording</span>
                </>
              ) : (
                <>
                  <Disc className="w-3.5 h-3.5 text-rose-500" />
                  <span>Record Call</span>
                </>
              )}
            </button>

            {/* Worship Floating Reactions Trigger Bar */}
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 px-1.5 py-1 rounded-xl shrink-0">
              <button
                onClick={() => triggerWorshipReaction("🙏 Amen")}
                className="px-2 py-1 rounded hover:bg-slate-800 text-[11px] sm:text-xs font-semibold text-amber-400 transition cursor-pointer"
              >
                🙏 Amen
              </button>
              <button
                onClick={() => triggerWorshipReaction("🙌 Hallelujah")}
                className="px-2 py-1 rounded hover:bg-slate-800 text-[11px] sm:text-xs font-semibold text-emerald-400 transition cursor-pointer"
              >
                🙌 Hallelujah
              </button>
              <button
                onClick={() => triggerWorshipReaction("❤️ Praying")}
                className="px-2 py-1 rounded hover:bg-slate-800 text-[11px] sm:text-xs font-semibold text-rose-400 transition cursor-pointer"
              >
                ❤️ Praying
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Floating Reactions Overlay */}
        <div className="absolute inset-0 pointer-events-none z-30 flex items-end justify-center pb-24 space-x-4 overflow-hidden">
          {floatingReactions.map((r) => (
            <div
              key={r.id}
              className="animate-bounce bg-slate-900/90 border border-amber-500/40 text-amber-300 px-4 py-2 rounded-full font-bold text-sm shadow-xl backdrop-blur"
            >
              {r.emoji}
            </div>
          ))}
        </div>

        {/* LiveKit Meeting Frame */}
        <div className="flex-1 bg-slate-950 relative overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full space-y-3 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
              <p className="text-xs font-medium">Entering Sacred Gathering Chamber...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full space-y-3 text-slate-400 text-center p-6">
              <p className="text-sm font-semibold text-rose-400">{error}</p>
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-200 text-xs font-medium cursor-pointer"
              >
                Close Room
              </button>
            </div>
          ) : token && wsUrl ? (
            <LiveKitRoom
              video={true}
              audio={true}
              token={token}
              serverUrl={wsUrl}
              data-lk-theme="default"
              className="h-full flex flex-col justify-between"
              onDisconnected={onClose}
              options={{
                adaptiveStream: true,
                dynacast: true,
              }}
              connectOptions={{
                autoSubscribe: true,
                maxRetries: 3,
              }}
              onError={(err) => {
                console.warn("LiveKit Room connection warning:", err);
              }}
            >
              <VideoConference />
              <RoomAudioRenderer />
            </LiveKitRoom>
          ) : null}
        </div>
      </div>
    </div>
  );
}
