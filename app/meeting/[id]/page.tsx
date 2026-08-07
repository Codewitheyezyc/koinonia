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
  Users, CheckCircle2, ArrowRight, Shield, Disc, Square,
} from "lucide-react";

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
  const [floatingReactions, setFloatingReactions] = useState<{ id: number; emoji: string }[]>([]);

  const mountedRef = useRef(true);
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

  const triggerReaction = (emoji: string) => {
    const id = Date.now();
    setFloatingReactions((prev) => [...prev, { id, emoji }]);
    setTimeout(() => {
      if (mountedRef.current) setFloatingReactions((prev) => prev.filter((r) => r.id !== id));
    }, 2500);
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
              Thank You for Joining Us!
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              You just participated in <span className="text-slate-200 font-semibold">{cell.name}</span> Live Meeting. Become an official member of this Cell to access shared Rhapsody study notes, prayer boards, and cell chat!
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 space-y-2 text-left">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Full Cell Membership Includes:</span>
            </div>
            <ul className="space-y-1 text-slate-400 pl-6 list-disc">
              <li>Access to Cell Prayer Boards & Intercessions</li>
              <li>Rhapsody of Realities & Bible Study Notes</li>
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
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[11px] font-bold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Cell Meeting
            </span>
            <h1 className="font-serif text-2xl font-bold text-slate-50">{cell.name}</h1>
            <p className="text-xs text-slate-400">
              Hosted by <span className="text-slate-200 font-medium">{cell.profiles?.full_name || "Cell Leader"}</span>
            </p>
          </div>

          <form onSubmit={handleJoinCall} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Your Name / Display Name</label>
              <input
                type="text"
                required
                autoFocus
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="e.g. Sister Grace, Brother John"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
              />
              <p className="text-[10px] text-slate-500">
                You will enter the live video call directly as a guest participant.
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
    <div className="flex h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden flex-col">
      {/* Top Header Bar */}
      <div className="px-4 sm:px-6 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-2 shrink-0 z-20">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${isConnected ? "bg-emerald-500 animate-pulse" : "bg-slate-600"}`} />
          <h3 className="font-serif text-xs sm:text-sm font-bold text-slate-100 truncate">
            {cell.name} — Live Cell Meeting
          </h3>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Confessions & Worship Reactions */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 px-1.5 py-1 rounded-xl">
            {[["🔥", "Glory", "text-amber-400"], ["🙌", "Hallelujah", "text-emerald-400"], ["🙏", "Amen", "text-amber-300"], ["❤️", "Praise God", "text-rose-400"]].map(([icon, label, color]) => (
              <button
                key={label}
                onClick={() => triggerReaction(`${icon} ${label}`)}
                className={`px-2 py-1 rounded hover:bg-slate-800 text-[11px] font-semibold ${color} transition cursor-pointer`}
              >
                {icon}
              </button>
            ))}
          </div>

          <button
            onClick={handleLeaveCall}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition cursor-pointer"
          >
            <PhoneOff className="w-3.5 h-3.5" />
            <span>Leave Call</span>
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

      {/* LiveKit Video Frame */}
      <div className="flex-1 bg-slate-950 relative overflow-hidden">
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
    </div>
  );
}
