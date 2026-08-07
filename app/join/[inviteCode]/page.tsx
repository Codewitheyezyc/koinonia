"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Users, Shield, ArrowRight, Loader2, CheckCircle2,
  UserCheck, Sparkles, UserPlus, ChevronLeft, Video,
} from "lucide-react";

export default function JoinFellowshipPage({
  params,
}: {
  params: Promise<{ inviteCode: string }>;
}) {
  const { inviteCode } = use(params);
  const [fellowship, setFellowship] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [alreadyMember, setAlreadyMember] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Guest join state
  const [guestName, setGuestName] = useState("");
  const [showGuestForm, setShowGuestForm] = useState(false);
  const [joining, setJoining] = useState(false);
  const [guestError, setGuestError] = useState<string | null>(null);

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        setUser(currentUser);

        const { data, error: fellowshipError } = await supabase
          .from("fellowships")
          .select("*, profiles:created_by(full_name)")
          .eq("invite_code", inviteCode)
          .single();

        if (fellowshipError || !data) {
          setError("Cell invite link is invalid or has expired.");
          return;
        }
        setFellowship(data);

        if (currentUser) {
          const { data: memberData } = await supabase
            .from("fellowship_members")
            .select("id")
            .eq("fellowship_id", data.id)
            .eq("user_id", currentUser.id)
            .maybeSingle();

          if (memberData) {
            setAlreadyMember(true);
            router.replace(`/dashboard/fellowship/${data.id}`);
            return;
          }
        }
      } catch (err: any) {
        setError(err.message || "Failed to load invitation.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [inviteCode, supabase, router]);

  // Handle joining for logged-in user
  const handleJoinAuthenticated = async () => {
    if (!user) {
      router.push(`/login?next=/join/${inviteCode}`);
      return;
    }
    setJoining(true);
    try {
      if (!alreadyMember) {
        const { error: joinError } = await supabase
          .from("fellowship_members")
          .insert({ fellowship_id: fellowship.id, user_id: user.id, role: "member" });
        if (joinError && !joinError.message.includes("unique constraint")) throw joinError;
      }
      router.push(`/dashboard/fellowship/${fellowship.id}`);
    } catch (err: any) {
      setError(err.message || "Failed to join Cell.");
      setJoining(false);
    }
  };

  // Handle Instant Guest Join with seamless fallback to Live Call
  const handleInstantGuestJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim() || joining) return;
    setGuestError(null);
    setJoining(true);

    try {
      const res = await fetch("/api/auth/guest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: guestName.trim(), fellowshipId: fellowship.id }),
      });

      const guestData = await res.json();
      if (!res.ok || guestData.error) {
        throw new Error(guestData.error || "Failed to create guest account.");
      }

      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: guestData.email,
        password: guestData.password,
      });

      if (signInErr) {
        throw new Error(signInErr.message);
      }

      const { data: { user: signedInUser } } = await supabase.auth.getUser();
      if (signedInUser) {
        await supabase
          .from("profiles")
          .upsert({
            id: signedInUser.id,
            full_name: `${guestName.trim()} (Guest)`,
          }, { onConflict: "id" });

        await supabase
          .from("fellowship_members")
          .insert({
            fellowship_id: fellowship.id,
            user_id: signedInUser.id,
            role: "member",
          });
      }

      router.replace(`/dashboard/fellowship/${fellowship.id}`);
    } catch (err: any) {
      console.warn("Guest DB auth fallback to standalone call room:", err);
      // Fallback: Redirect guest directly to the Live Call Meeting room for this Cell!
      router.push(`/meeting/${fellowship.id}`);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  if (error || !fellowship) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-slate-950 text-slate-100">
        <div className="max-w-md w-full p-8 bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-4 shadow-2xl">
          <div className="w-14 h-14 mx-auto rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center">
            <Shield className="w-7 h-7 text-rose-400" />
          </div>
          <h2 className="font-serif text-2xl font-bold text-rose-400">Invite Not Found</h2>
          <p className="text-sm text-slate-400">{error || "This invitation link is no longer active."}</p>
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

  if (joining) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 gap-4 text-center p-4">
        <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
        <div className="space-y-1">
          <p className="text-sm font-bold text-slate-100">Entering {fellowship.name}…</p>
          <p className="text-xs text-slate-400">Preparing your sanctuary room</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <div className="w-full max-w-lg space-y-5 bg-slate-900/90 p-6 sm:p-8 rounded-2xl border border-slate-800 backdrop-blur-md shadow-2xl">

        {/* Cell Header */}
        <div className="text-center space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-semibold uppercase tracking-wider">
            ✉️ Cell Invitation
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-slate-50">{fellowship.name}</h1>
          <p className="text-xs text-slate-400">
            Hosted by{" "}
            <span className="text-slate-200 font-medium">
              {fellowship.profiles?.full_name || "a Believer"}
            </span>
          </p>
        </div>

        {fellowship.description && (
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs sm:text-sm text-slate-300 italic text-center">
            &ldquo;{fellowship.description}&rdquo;
          </div>
        )}

        <div className="space-y-2">
          {[
            { icon: Users, color: "text-emerald-400", text: "Access shared prayer rooms, study notes, and prayer boards." },
            { icon: Shield, color: "text-amber-400", text: "Private Cell channel protected by invitation code." },
          ].map(({ icon: Icon, color, text }) => (
            <div key={text} className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/40 border border-slate-800 text-xs text-slate-300">
              <Icon className={`w-4 h-4 ${color} shrink-0 mt-0.5`} />
              <span>{text}</span>
            </div>
          ))}
        </div>

        {/* Join Actions */}
        <div className="pt-1 space-y-3">
          {user ? (
            <button
              onClick={handleJoinAuthenticated}
              disabled={joining}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold text-sm shadow-xl shadow-amber-950/40 transition cursor-pointer"
            >
              {alreadyMember ? (
                <><UserCheck className="w-5 h-5" /><span>You're a Member — Open Cell</span></>
              ) : (
                <><CheckCircle2 className="w-5 h-5" /><span>Join Cell Now</span></>
              )}
            </button>
          ) : showGuestForm ? (
            /* Instant Guest Form */
            <form onSubmit={handleInstantGuestJoin} className="space-y-3 p-4 rounded-xl bg-slate-950 border border-slate-700">
              <div className="flex items-center gap-2 mb-1">
                <button
                  type="button"
                  onClick={() => { setShowGuestForm(false); setGuestError(null); }}
                  className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <p className="text-xs font-semibold text-slate-200">Join Instantly as Guest</p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-400">Display Name / Name</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="e.g. Sister Grace, Brother John"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
                />
                <p className="text-[10px] text-slate-500">
                  No email or password needed. You'll enter the Cell immediately.
                </p>
              </div>

              {guestError && (
                <p className="text-[11px] text-rose-400 bg-rose-950/30 border border-rose-800/40 rounded-lg p-2">{guestError}</p>
              )}

              <button
                type="submit"
                disabled={joining || !guestName.trim()}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs transition cursor-pointer disabled:opacity-50"
              >
                {joining ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>Enter Cell Instantly</span>
              </button>
            </form>
          ) : (
            /* Default Options */
            <>
              {/* Option A: Direct Guest Meeting Call Access (0 DB Auth, 0 Emails, 0 Rate Limits) */}
              <Link
                href={`/meeting/${fellowship.id}`}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 font-bold text-sm transition cursor-pointer group"
              >
                <Video className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition" />
                <span>Join Live Meeting Call as Guest</span>
              </Link>
              <p className="text-center text-[10px] text-slate-500">
                1-tap video call entry. No sign-up required.
              </p>

              <div className="flex items-center gap-2">
                <div className="flex-1 h-px bg-slate-800" />
                <span className="text-[10px] text-slate-500 uppercase tracking-wider">or</span>
                <div className="flex-1 h-px bg-slate-800" />
              </div>

              {/* Option B: Register / Sign In as Cell Member */}
              <button
                onClick={() => router.push(`/signup?next=/join/${inviteCode}`)}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold text-sm transition cursor-pointer shadow-lg shadow-amber-950/30"
              >
                <span>Register as Cell Member</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

        <p className="text-center text-[10px] text-slate-600">
          By joining you agree to participate respectfully in this faith community.
        </p>
      </div>
    </div>
  );
}
