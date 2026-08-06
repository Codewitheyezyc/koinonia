"use client";

import { useEffect, useState, useRef } from "react";
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { X, Loader2, Disc, Square, PhoneOff, AlertCircle } from "lucide-react";

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
  const [isConnected, setIsConnected] = useState(false);

  // Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [egressId, setEgressId] = useState<string | null>(null);
  const [recordingLoading, setRecordingLoading] = useState(false);

  // Track if component is mounted to avoid state updates after unmount
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!isOpen || !fellowshipId) return;

    // Reset state whenever modal opens
    setToken(null);
    setWsUrl(null);
    setError(null);
    setIsConnected(false);

    async function fetchToken() {
      if (!mountedRef.current) return;
      setLoading(true);
      try {
        const res = await fetch("/api/livekit/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fellowshipId }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to join room");

        if (mountedRef.current) {
          setToken(data.token);
          setWsUrl(data.wsUrl);
        }
      } catch (err: any) {
        if (mountedRef.current) {
          setError(err.message || "Failed to connect to prayer room");
        }
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
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
        await fetch("/api/livekit/record/stop", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ egressId, fellowshipId }),
        });
        setIsRecording(false);
        setEgressId(null);
      } else {
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

  const handleLeaveRoom = () => {
    setToken(null);
    setWsUrl(null);
    setIsConnected(false);
    setIsRecording(false);
    setEgressId(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 backdrop-blur-md p-2 sm:p-4">
      <div className="w-full max-w-5xl h-[94vh] sm:h-[90vh] bg-slate-900 border border-slate-800 rounded-2xl flex flex-col overflow-hidden shadow-2xl relative">

        {/* Header Bar */}
        <div className="px-4 sm:px-6 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${isConnected ? "bg-emerald-500 animate-pulse" : "bg-slate-600"}`} />
            <h3 className="font-serif text-xs sm:text-sm font-bold text-slate-100 truncate">
              {fellowshipName} — Prayer Sanctuary
            </h3>
            {isRecording && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[10px] font-semibold uppercase animate-pulse shrink-0">
                <Disc className="w-2.5 h-2.5 text-rose-500" /> REC
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Worship Reactions */}
            <div className="flex items-center gap-0.5 bg-slate-900 border border-slate-800 px-1 py-1 rounded-xl">
              {[["🙏", "Amen", "text-amber-400"], ["🙌", "Hallelujah", "text-emerald-400"], ["❤️", "Praying", "text-rose-400"]].map(([icon, label, color]) => (
                <button
                  key={label}
                  onClick={() => triggerWorshipReaction(`${icon} ${label}`)}
                  className={`px-1.5 py-1 rounded hover:bg-slate-800 text-[10px] sm:text-xs font-semibold ${color} transition cursor-pointer`}
                >
                  {icon}
                </button>
              ))}
            </div>

            {/* Record Toggle */}
            <button
              onClick={handleToggleRecording}
              disabled={recordingLoading || !isConnected}
              className={`flex items-center gap-1 px-2 py-1.5 rounded-lg border text-[11px] font-semibold transition cursor-pointer shrink-0 disabled:opacity-40 ${
                isRecording
                  ? "bg-rose-950/60 border-rose-800 text-rose-300"
                  : "bg-slate-900 border-slate-800 text-slate-300 hover:text-rose-400"
              }`}
            >
              {recordingLoading ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : isRecording ? (
                <><Square className="w-3 h-3 fill-rose-400 text-rose-400" /><span className="hidden sm:inline">Stop</span></>
              ) : (
                <><Disc className="w-3 h-3 text-rose-500" /><span className="hidden sm:inline">Record</span></>
              )}
            </button>

            {/* Leave Button */}
            <button
              onClick={handleLeaveRoom}
              className="flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-semibold transition cursor-pointer shrink-0"
            >
              <PhoneOff className="w-3 h-3" />
              <span className="hidden sm:inline">Leave</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Floating Reactions Overlay */}
        <div className="absolute inset-0 pointer-events-none z-30 flex items-end justify-center pb-24 gap-3 overflow-hidden">
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
            <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-400">
              <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
              <div className="text-center space-y-1">
                <p className="text-sm font-semibold text-slate-300">Connecting to Prayer Room...</p>
                <p className="text-xs text-slate-500">Setting up your sacred gathering space</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-400 text-center p-6">
              <AlertCircle className="w-10 h-10 text-rose-400" />
              <div className="space-y-2">
                <p className="text-sm font-semibold text-rose-400">Unable to Connect</p>
                <p className="text-xs text-slate-500 max-w-sm">{error}</p>
                <p className="text-xs text-slate-600">Make sure your LiveKit URL and API keys are configured correctly in the Vercel environment variables.</p>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setError(null);
                    setToken(null);
                    setWsUrl(null);
                    // Retry
                    const event = new Event("retry");
                    window.dispatchEvent(event);
                  }}
                  className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-slate-950 text-xs font-semibold cursor-pointer"
                >
                  Retry Connection
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-200 text-xs font-medium cursor-pointer hover:bg-slate-700"
                >
                  Close
                </button>
              </div>
            </div>
          ) : token && wsUrl ? (
            <LiveKitRoom
              video={true}
              audio={true}
              token={token}
              serverUrl={wsUrl}
              data-lk-theme="default"
              style={{ height: "100%" }}
              options={{
                adaptiveStream: true,
                dynacast: true,
              }}
              onConnected={() => {
                if (mountedRef.current) setIsConnected(true);
              }}
              onDisconnected={(reason) => {
                // Only close if user intentionally left (not on connection errors)
                if (mountedRef.current) {
                  setIsConnected(false);
                  // reason 0 = CLIENT_INITIATED (user pressed leave)
                  // Don't auto-close on other reasons to avoid the flash-close bug
                  if (reason === 0) {
                    handleLeaveRoom();
                  }
                }
              }}
              onError={(err) => {
                console.error("LiveKit Room error:", err);
                if (mountedRef.current) {
                  setError(`Connection error: ${err.message || "Unable to connect to LiveKit server. Check your LIVEKIT_API_KEY, LIVEKIT_API_SECRET, and NEXT_PUBLIC_LIVEKIT_URL environment variables."}`);
                  setToken(null);
                  setWsUrl(null);
                }
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
