"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Users, Shield, ArrowRight, Loader2, CheckCircle2, UserCheck, UserPlus, Sparkles } from "lucide-react";
import SplashScreen from "@/components/SplashScreen";

export default function JoinFellowshipPage({ params }: { params: Promise<{ inviteCode: string }> }) {
  const { inviteCode } = use(params);
  const [fellowship, setFellowship] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [alreadyMember, setAlreadyMember] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guestName, setGuestName] = useState("");
  const [showGuestInput, setShowGuestInput] = useState(false);
  const [showSplash, setShowSplash] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function loadFellowshipAndUser() {
      try {
        setLoading(true);
        // Get current auth user
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        setUser(currentUser);

        // Fetch fellowship by invite code
        const { data, error: fellowshipError } = await supabase
          .from("fellowships")
          .select("*, profiles:created_by(full_name, avatar_url)")
          .eq("invite_code", inviteCode)
          .single();

        if (fellowshipError || !data) {
          setError("Fellowship invite link is invalid or has expired.");
          return;
        }

        setFellowship(data);

        // Check if user is already a member
        if (currentUser) {
          const { data: memberData } = await supabase
            .from("fellowship_members")
            .select("id")
            .eq("fellowship_id", data.id)
            .eq("user_id", currentUser.id)
            .maybeSingle();

          if (memberData) {
            setAlreadyMember(true);
          }
        }
      } catch (err: any) {
        setError(err.message || "Failed to load invitation.");
      } finally {
        setLoading(false);
      }
    }

    loadFellowshipAndUser();
  }, [inviteCode, supabase]);

  const handleJoinAuthenticated = async () => {
    if (!user) {
      router.push(`/login?next=/join/${inviteCode}`);
      return;
    }

    try {
      setJoining(true);

      if (!alreadyMember) {
        const { error: joinError } = await supabase
          .from("fellowship_members")
          .insert({
            fellowship_id: fellowship.id,
            user_id: user.id,
            role: "member",
          });

        if (joinError && !joinError.message.includes("unique constraint")) {
          throw joinError;
        }
      }

      setShowSplash(true);
      setTimeout(() => {
        router.push(`/dashboard/fellowship/${fellowship.id}`);
        router.refresh();
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Failed to join fellowship.");
      setJoining(false);
    }
  };

  const handleJoinAsGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim() || joining) return;

    setJoining(true);
    try {
      // 1. Sign in anonymously or create temporary guest session
      const { data: anonData, error: anonErr } = await supabase.auth.signInAnonymously({
        options: {
          data: {
            full_name: `${guestName.trim()} (Guest)`,
          },
        },
      });

      if (anonErr || !anonData.user) {
        // Fallback: If anonymous auth disabled in Supabase dashboard, redirect to signup with prefilled params
        router.push(`/signup?next=/join/${inviteCode}&name=${encodeURIComponent(guestName.trim())}`);
        return;
      }

      const guestUser = anonData.user;

      // 2. Create guest profile
      await supabase.from("profiles").upsert({
        id: guestUser.id,
        full_name: `${guestName.trim()} (Guest)`,
        bio: "Guest Believer participating in fellowship.",
      });

      // 3. Add to fellowship members
      await supabase.from("fellowship_members").insert({
        fellowship_id: fellowship.id,
        user_id: guestUser.id,
        role: "member",
      });

      setShowSplash(true);
      setTimeout(() => {
        router.push(`/dashboard/fellowship/${fellowship.id}`);
        router.refresh();
      }, 1500);
    } catch (err: any) {
      console.error("Guest join error:", err);
      // Fallback
      router.push(`/signup?next=/join/${inviteCode}`);
    } finally {
      setJoining(false);
    }
  };

  if (showSplash) {
    return <SplashScreen message={`Entering ${fellowship?.name || "Fellowship"}...`} />;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  if (error || !fellowship) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-slate-950 text-slate-100">
        <div className="max-w-md w-full p-8 bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-4 shadow-2xl">
          <h2 className="font-serif text-2xl font-bold text-rose-400">Invite Not Found</h2>
          <p className="text-sm text-slate-400">{error || "This invitation link is no longer active."}</p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 text-slate-200 text-sm hover:bg-slate-700 transition"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <div className="w-full max-w-lg space-y-6 bg-slate-900/90 p-6 sm:p-8 rounded-2xl border border-slate-800 backdrop-blur-md shadow-2xl">
        <div className="text-center space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-semibold uppercase tracking-wider">
            Fellowship Invitation
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-slate-50">{fellowship.name}</h1>
          <p className="text-xs text-slate-400">
            Hosted by <span className="text-slate-200 font-medium">{fellowship.profiles?.full_name || "a Believer"}</span>
          </p>
        </div>

        {fellowship.description && (
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs sm:text-sm text-slate-300 italic text-center">
            &ldquo;{fellowship.description}&rdquo;
          </div>
        )}

        <div className="space-y-3 pt-1">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/40 border border-slate-800 text-xs text-slate-300">
            <Users className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Access shared audio/video prayer rooms, study notes, and prayer boards.</span>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/40 border border-slate-800 text-xs text-slate-300">
            <Shield className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Private community protected under Row-Level Security.</span>
          </div>
        </div>

        {/* Join Actions */}
        <div className="pt-3 space-y-3">
          {user ? (
            <button
              onClick={handleJoinAuthenticated}
              disabled={joining}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold text-sm shadow-xl shadow-amber-950/40 transition disabled:opacity-50 cursor-pointer"
            >
              {joining ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : alreadyMember ? (
                <>
                  <UserCheck className="w-5 h-5 text-slate-950" />
                  <span>You are a Member — Open Fellowship</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5 text-slate-950" />
                  <span>Join Fellowship Now</span>
                </>
              )}
            </button>
          ) : (
            <>
              {showGuestInput ? (
                <form onSubmit={handleJoinAsGuest} className="space-y-3 p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">Your Name / Display Name</label>
                    <input
                      type="text"
                      required
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      placeholder="e.g. Sister Grace"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={joining || !guestName.trim()}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs transition cursor-pointer disabled:opacity-50"
                  >
                    {joining ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    <span>Enter Fellowship as Guest</span>
                  </button>
                </form>
              ) : (
                <button
                  onClick={() => setShowGuestInput(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600/15 hover:bg-emerald-600/25 border border-emerald-500/30 text-emerald-300 font-bold text-xs transition cursor-pointer"
                >
                  <UserPlus className="w-4 h-4 text-emerald-400" />
                  <span>Join Instantly as Guest (No Password Required)</span>
                </button>
              )}

              <button
                onClick={handleJoinAuthenticated}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold text-xs transition cursor-pointer shadow-lg shadow-amber-950/30"
              >
                <span>Sign In or Register Full Account</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
