"use client";

import { use, useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
} from "@livekit/components-react";
import "@livekit/components-styles";
import {
  Video, Sparkles, Loader2, PhoneOff, AlertCircle,
  Users, CheckCircle2, ArrowRight, Shield, MessageSquare,
  Send, Smile, X, Heart, Flame
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
  { icon: "👑", label: "King of Kings", color: "text-yellow-400" },
  { icon: "✨", label: "Blessings", color: "text-amber-200" },
  { icon: "🎉", label: "Rejoice", color: "text-purple-400" },
];

interface InCallMessage {
  id: string;
  senderName: string;
  isGuest: boolean;
  content: string;
  time: string;
}

export default function StandaloneMeetingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: cellId } = use(params);
  const [cell, setCell] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Guest entry state
  const [guestName, setGuestName] = useState("");
  const [hasEntered, setHasEntered] = useState(false);
  const [joining, setJoining] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [wsUrl, setWsUrl] = useState<string | null>(null);

  // Call status state
  const [isConnected, setIsConnected] = useState(false);
  const [callEnded, setCallEnded] = useState(false);
  const [floatingReactions, setFloatingReactions] = useState<{ id: number; emoji: string; xPos: number }[]>([]);

  // In-Call Live Chat Drawer
  const [showInCallChat, setShowInCallChat] = useState(false);
  const [inCallMessages, setInCallMessages] = useState<InCallMessage[]>([]);
  const [inCallInput, setInCallInput] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const mountedRef = useRef(true);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    async function loadCellData() {
      try {
        setLoading(true);
        const { data, error: cellErr } = await supabase
          .from("fellowships")
          .select("*, profiles:created_by(full_name)")
          .eq("id", cellId)
          .single();

        if (cellErr || !data) {
          setError("Meeting room not found or link has expired.");
          return;
        }

        setCell(data);

        // If user is already logged in, fetch their name automatically
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", user.id)
            .single();

          if (profile?.full_name) {
            setGuestName(profile.full_name);
          }
        }
      } catch (err: any) {
        setError(err.message || "Failed to load live meeting.");
      } finally {
        setLoading(false);
      }
    }
    loadCellData();
  }, [cellId, supabase]);

  const handleJoinCall = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim() || joining) return;

    setJoining(true);
    setError(null);

    try {
      const res = await fetch("/api/livekit/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cellId, guestName: guestName.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to join live call");

      if (mountedRef.current) {
        setToken(data.token);
        setWsUrl(data.wsUrl);
        setHasEntered(true);
      }
    } catch (err: any) {
      if (mountedRef.current) {
        setError(err.message || "Failed to connect to live cell meeting.");
      }
    } finally {
      if (mountedRef.current) setJoining(false);
    }
  };

  const triggerWorshipReaction = (emojiText: string) => {
    // Play harmonic worship audio chime
    worshipChimes.playChime(
      emojiText.includes("🔥") ? "glory" : emojiText.includes("🙌") ? "amen" : emojiText.includes("👑") ? "rejoice" : "spirit"
    );

    const id = Date.now();
    const xPos = Math.floor(Math.random() * 60) + 20; // 20% to 80% horizontal offset
    setFloatingReactions((prev) => [...prev, { id, emoji: emojiText, xPos }]);

    // Add to in-call live stream reaction note
    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setInCallMessages((prev) => [
      ...prev,
      {
        id: `rx-${id}`,
        senderName: guestName.trim() || "Participant",
        isGuest: !guestName.includes("@"),
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
      id: `call-msg-${Date.now()}`,
      senderName: guestName.trim() || "Participant",
      isGuest: true,
      content: inCallInput.trim(),
      time,
    };

    setInCallMessages((prev) => [...prev, newMsg]);
    setInCallInput("");
    setShowEmojiPicker(false);
    setTimeout(() => chatScrollRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const handleLeaveCall = () => {
    setToken(null);
    setWsUrl(null);
    setIsConnected(false);
    setCallEnded(true);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  if (error || !cell) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-slate-950 text-slate-100">
        <div className="max-w-md w-full p-8 bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-4 shadow-2xl">
          <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
          <h2 className="font-serif text-2xl font-bold text-rose-400">Meeting Not Found</h2>
          <p className="text-sm text-slate-400">{error || "This meeting link is no longer active."}</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 text-slate-200 text-sm hover:bg-slate-700 transition"
          >
            Go to Homepage
          </Link>
        </div>
      </div>
    );
  }

  // ── Post-Call Conversion Card (Shown after guest leaves) ──
  if (callEnded) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100">
        <div className="w-full max-w-lg space-y-6 bg-slate-900/90 p-6 sm:p-8 rounded-2xl border border-slate-800 backdrop-blur-md shadow-2xl text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shadow-lg shadow-amber-950/30">
            <Sparkles className="w-8 h-8 text-amber-400" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
              Glory to God!
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-slate-50">
              Thank You for Gathering with Us!
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              You just participated in <span className="text-slate-200 font-semibold">{cell.name}</span> Live Meeting. Register as an official member to access shared scripture study notes, prayer boards, and cell chat!
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 space-y-2 text-left">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Full Cell Membership Includes:</span>
            </div>
            <ul className="space-y-1 text-slate-400 pl-6 list-disc">
              <li>Access to Cell Prayer Boards & Intercessions</li>
              <li>Daily Word & Bible Study Notes</li>
              <li>24/7 Cell Chat & Community Channels</li>
            </ul>
          </div>

          <div className="pt-2 space-y-3">
            <Link
              href={`/join/${cell.invite_code}`}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold text-sm shadow-xl shadow-amber-950/40 transition cursor-pointer"
            >
              <span>Register & Join {cell.name}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <button
              onClick={() => {
                setCallEnded(false);
                setHasEntered(false);
              }}
              className="text-xs text-slate-400 hover:text-slate-200 transition cursor-pointer underline"
            >
              Re-enter Call
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Pre-Call Guest Display Name Form ──
  if (!hasEntered) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100">
        <div className="w-full max-w-md space-y-6 bg-slate-900/90 p-6 sm:p-8 rounded-2xl border border-slate-800 backdrop-blur-md shadow-2xl">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-950/20">
              <Video className="w-7 h-7" />
            </div>
            <div className="flex items-center justify-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[11px] font-bold uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live Cell Meeting
              </span>
              <GuestBadge size="xs" />
            </div>
            <h1 className="font-serif text-2xl font-bold text-slate-50">{cell.name}</h1>
            <p className="text-xs text-slate-400">
              Hosted by <span className="text-slate-200 font-medium">{cell.profiles?.full_name || "Cell Leader"}</span>
            </p>
          </div>

          <form onSubmit={handleJoinCall} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                <label>Your Name / Display Name</label>
                <GuestBadge size="xs" />
              </div>
              <input
                type="text"
                required
                autoFocus
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="e.g. Sister Grace, Brother John"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition shadow-inner"
              />
              <p className="text-[10px] text-slate-500">
                You will enter the live video call directly with a stylized guest tag.
              </p>
            </div>

            {error && (
              <p className="text-xs text-rose-400 bg-rose-950/40 border border-rose-800/40 rounded-lg p-2.5">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={joining || !guestName.trim()}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-950/30 transition cursor-pointer disabled:opacity-50"
            >
              {joining ? <Loader2 className="w-4 h-4 animate-spin" /> : <Video className="w-4 h-4" />}
              <span>Enter Live Cell Meeting</span>
            </button>
          </form>

          <p className="text-center text-[10px] text-slate-500">
            Christ Embassy Cell Ministry — Live Gathering Room
          </p>
        </div>
      </div>
    );
  }

  // ── Active LiveKit Meeting Room (Call-Only Isolation) ──
  return (
    <div className="flex h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden flex-col relative">
      {/* Top Header Bar */}
      <div className="px-3 sm:px-6 py-2.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-2 shrink-0 z-20">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${isConnected ? "bg-emerald-500 animate-pulse" : "bg-slate-600"}`} />
          <h3 className="font-serif text-xs sm:text-sm font-bold text-slate-100 truncate">
            {cell.name} — Live Cell Meeting
          </h3>
          <GuestBadge size="xs" className="hidden sm:inline-flex" />
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Confessions & Worship Emojis Bar */}
          <div className="flex items-center gap-0.5 bg-slate-900 border border-slate-800 px-1 py-1 rounded-xl">
            {WORSHIP_REACTIONS.map(({ icon, label, color }) => (
              <button
                key={label}
                onClick={() => triggerWorshipReaction(`${icon} ${label}`)}
                title={label}
                className={`px-1.5 sm:px-2 py-1 rounded hover:bg-slate-800 text-[11px] sm:text-xs font-semibold ${color} transition cursor-pointer flex items-center gap-1`}
              >
                <span>{icon}</span>
                <span className="hidden lg:inline text-[10px]">{label}</span>
              </button>
            ))}
          </div>

          {/* Toggle In-Call Live Chat Drawer */}
          <button
            onClick={() => setShowInCallChat((prev) => !prev)}
            title="Meeting Chat & Reactions"
            className={`p-2 rounded-xl border transition cursor-pointer ${
              showInCallChat
                ? "bg-amber-500/15 border-amber-500 text-amber-300"
                : "bg-slate-900 border-slate-800 text-slate-300 hover:text-amber-400"
            }`}
          >
            <MessageSquare className="w-4 h-4" />
          </button>

          {/* Leave Call Button */}
          <button
            onClick={handleLeaveCall}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition cursor-pointer shadow-md"
          >
            <PhoneOff className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Leave Call</span>
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

      {/* Main Video & Live Chat Canvas */}
      <div className="flex-1 flex bg-slate-950 relative overflow-hidden">
        {/* Video Canvas */}
        <div className="flex-1 h-full relative overflow-hidden">
          {token && wsUrl ? (
            <LiveKitRoom
              video={true}
              audio={true}
              token={token}
              serverUrl={wsUrl}
              data-lk-theme="default"
              style={{ height: "100%" }}
              options={{ adaptiveStream: true, dynacast: true }}
              onConnected={() => setIsConnected(true)}
              onDisconnected={() => handleLeaveCall()}
              onError={(err) => console.error("LiveKit error:", err)}
            >
              <VideoConference />
              <RoomAudioRenderer />
            </LiveKitRoom>
          ) : null}
        </div>

        {/* In-Call Live Chat & Reaction Drawer */}
        {showInCallChat && (
          <div className="w-72 sm:w-80 h-full bg-slate-900 border-l border-slate-800 flex flex-col z-20 shadow-2xl animate-in slide-in-from-right duration-200">
            {/* Chat Drawer Header */}
            <div className="p-3 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-100">
                <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                <span>Live Meeting Chat</span>
              </div>
              <button
                onClick={() => setShowInCallChat(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Chat Message Stream */}
            <div className="flex-1 p-3 overflow-y-auto space-y-3">
              {inCallMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-2 text-slate-500">
                  <Sparkles className="w-6 h-6 text-amber-400/40" />
                  <p className="text-xs font-medium text-slate-400">Meeting Chat is Quiet</p>
                  <p className="text-[10px] max-w-xs text-slate-500">
                    Send words of encouragement, scripture references, or reaction emojis during the call.
                  </p>
                </div>
              ) : (
                inCallMessages.map((msg) => (
                  <div key={msg.id} className="space-y-1 p-2 rounded-xl bg-slate-950/60 border border-slate-800/80">
                    <div className="flex items-center justify-between text-[11px]">
                      <FormattedAuthorName name={msg.senderName} className="font-semibold text-slate-200 text-[11px]" />
                      <span className="text-[9px] text-slate-500">{msg.time}</span>
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

            {/* In-Call Quick Emoji Picker Popover */}
            {showEmojiPicker && (
              <div className="p-2 border-t border-slate-800 bg-slate-950 grid grid-cols-6 gap-1.5">
                {WORSHIP_REACTIONS.map(({ icon }) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => {
                      setInCallInput((prev) => prev + " " + icon);
                      setShowEmojiPicker(false);
                    }}
                    className="p-2 text-base rounded-lg hover:bg-slate-800 transition cursor-pointer text-center"
                  >
                    {icon}
                  </button>
                ))}
              </div>
            )}

            {/* Chat Input */}
            <form onSubmit={handleSendInCallMessage} className="p-2.5 bg-slate-950 border-t border-slate-800 flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setShowEmojiPicker((prev) => !prev)}
                className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-amber-400 transition cursor-pointer"
              >
                <Smile className="w-4 h-4" />
              </button>
              <input
                type="text"
                value={inCallInput}
                onChange={(e) => setInCallInput(e.target.value)}
                placeholder="Type a message or amen..."
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
  );
}
