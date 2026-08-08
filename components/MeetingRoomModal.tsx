"use client";

import { useEffect, useState, useRef } from "react";
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
} from "@livekit/components-react";
import "@livekit/components-styles";
import {
  X, Loader2, Disc, Square, PhoneOff, AlertCircle,
  MessageSquare, Smile, Send, Sparkles, Trash2
} from "lucide-react";
import GuestBadge, { FormattedAuthorName } from "@/components/GuestBadge";
import FormattedMessageContent from "@/components/FormattedMessageContent";
import { worshipChimes } from "@/lib/audio/worshipChimes";

const WORSHIP_REACTIONS = [
  { icon: "🔥", label: "Glory!", color: "text-amber-400" },
  { icon: "🙌", label: "Hallelujah!", color: "text-emerald-400" },
  { icon: "🙏", label: "Amen", color: "text-amber-300" },
  { icon: "❤️", label: "Praise God", color: "text-rose-400" },
  { icon: "🕊️", label: "Holy Spirit", color: "text-sky-300" },
  { icon: "👑", label: "King", color: "text-yellow-400" },
];

interface InCallMessage {
  id: string;
  senderName: string;
  content: string;
  time: string;
}

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
  const [floatingReactions, setFloatingReactions] = useState<{ id: number; emoji: string; xPos: number }[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  // In-Call Chat Drawer state
  const [showInCallChat, setShowInCallChat] = useState(false);
  const [inCallMessages, setInCallMessages] = useState<InCallMessage[]>([]);
  const [inCallInput, setInCallInput] = useState("");

  // Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [egressId, setEgressId] = useState<string | null>(null);
  const [recordingLoading, setRecordingLoading] = useState(false);

  // Track component mounted
  const mountedRef = useRef(true);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!isOpen || !fellowshipId) return;

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

  const triggerWorshipReaction = (emojiText: string) => {
    // Play harmonic worship audio chime
    worshipChimes.playChime(
      emojiText.includes("🔥") ? "glory" : emojiText.includes("🙌") ? "amen" : emojiText.includes("👑") ? "rejoice" : "spirit"
    );

    const id = Date.now();
    const xPos = Math.floor(Math.random() * 60) + 20;
    setFloatingReactions((prev) => [...prev, { id, emoji: emojiText, xPos }]);

    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setInCallMessages((prev) => [
      ...prev,
      {
        id: `rx-${id}`,
        senderName: "Believer",
        content: `shared ${emojiText}`,
        time,
      },
    ]);

    setTimeout(() => {
      if (mountedRef.current) {
        setFloatingReactions((prev) => prev.filter((r) => r.id !== id));
      }
    }, 2800);
  };

  const handleSendInCallMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inCallInput.trim()) return;

    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const newMsg: InCallMessage = {
      id: `msg-${Date.now()}`,
      senderName: "Believer",
      content: inCallInput.trim(),
      time,
    };

    setInCallMessages((prev) => [...prev, newMsg]);
    setInCallInput("");
    setTimeout(() => chatScrollRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
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
        <div className="px-4 sm:px-6 py-2.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-2 shrink-0">
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
            {/* Worship Reactions Bar */}
            <div className="flex items-center gap-0.5 bg-slate-900 border border-slate-800 px-1 py-1 rounded-xl">
              {WORSHIP_REACTIONS.map(({ icon, label, color }) => (
                <button
                  key={label}
                  onClick={() => triggerWorshipReaction(`${icon} ${label}`)}
                  title={label}
                  className={`px-1.5 py-1 rounded hover:bg-slate-800 text-[10px] sm:text-xs font-semibold ${color} transition cursor-pointer`}
                >
                  {icon}
                </button>
              ))}
            </div>

            {/* In-Call Chat Toggle */}
            <button
              onClick={() => setShowInCallChat((prev) => !prev)}
              title="Toggle Meeting Chat"
              className={`p-1.5 rounded-lg border transition cursor-pointer ${
                showInCallChat
                  ? "bg-amber-500/20 border-amber-500 text-amber-300"
                  : "bg-slate-900 border-slate-800 text-slate-300 hover:text-amber-400"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
            </button>

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
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-semibold transition cursor-pointer shrink-0"
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

        {/* Floating Animated Emojis Stream Overlay */}
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

        {/* Meeting Canvas with Video & Live Chat */}
        <div className="flex-1 flex bg-slate-950 relative overflow-hidden">
          <div className="flex-1 h-full relative overflow-hidden">
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
                </div>
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-200 text-xs font-medium cursor-pointer hover:bg-slate-700"
                >
                  Close
                </button>
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
                  if (mountedRef.current) {
                    setIsConnected(false);
                    if (reason === 0) {
                      handleLeaveRoom();
                    }
                  }
                }}
                onError={(err) => {
                  console.error("LiveKit Room error:", err);
                }}
              >
                <VideoConference />
                <RoomAudioRenderer />
              </LiveKitRoom>
            ) : null}
          </div>

          {/* In-Call Live Chat Drawer */}
          {showInCallChat && (
            <div className="w-72 sm:w-80 h-full bg-slate-900 border-l border-slate-800 flex flex-col z-20 shadow-2xl animate-in slide-in-from-right duration-200">
              <div className="p-3 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-100">
                  <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                  <span>In-Call Live Chat</span>
                </div>
                <button
                  onClick={() => setShowInCallChat(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 p-3 overflow-y-auto space-y-3">
                {inCallMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center space-y-2 text-slate-500">
                    <Sparkles className="w-6 h-6 text-amber-400/40" />
                    <p className="text-xs font-medium text-slate-400">Meeting Chat is Quiet</p>
                    <p className="text-[10px] max-w-xs text-slate-500">
                      Send words of encouragement, prayers, or reactions during the call.
                    </p>
                  </div>
                ) : (
                  inCallMessages.map((msg) => (
                    <div key={msg.id} className="space-y-1 p-2 rounded-xl bg-slate-950/60 border border-slate-800/80 group/msg relative">
                      <div className="flex items-center justify-between text-[11px]">
                        <FormattedAuthorName name={msg.senderName} className="font-semibold text-slate-200 text-[11px]" />
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] text-slate-500">{msg.time}</span>
                          <button
                            onClick={() => setInCallMessages((prev) => prev.filter((m) => m.id !== msg.id))}
                            title="Delete message"
                            className="opacity-0 group-hover/msg:opacity-100 p-0.5 text-slate-500 hover:text-rose-400 transition"
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </div>
                      <FormattedMessageContent
                        content={msg.content}
                        className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap break-words"
                      />
                    </div>
                  ))
                )}
                <div ref={chatScrollRef} />
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendInCallMessage} className="p-2.5 bg-slate-950 border-t border-slate-800 flex items-center gap-1.5">
                <input
                  type="text"
                  value={inCallInput}
                  onChange={(e) => setInCallInput(e.target.value)}
                  placeholder="Type an in-call message..."
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
                />
                <button
                  type="submit"
                  disabled={!inCallInput.trim()}
                  className="p-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-slate-950 transition disabled:opacity-40 cursor-pointer font-bold"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
