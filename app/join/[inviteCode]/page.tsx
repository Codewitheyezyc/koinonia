"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Users, Shield, ArrowRight, Loader2, CheckCircle2, UserCheck } from "lucide-react";

export default function JoinFellowshipPage({ params }: { params: Promise<{ inviteCode: string }> }) {
  const { inviteCode } = use(params);
  const [fellowship, setFellowship] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [alreadyMember, setAlreadyMember] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  const handleJoin = async () => {
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

      router.push(`/dashboard/fellowship/${fellowship.id}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to join fellowship.");
      setJoining(false);
    }
  };

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
        <div className="max-w-md w-full p-8 bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-4">
          <h2 className="font-serif text-2xl font-bold text-rose-400">Invite Not Found</h2>
          <p className="text-sm text-slate-400">{error || "This invitation link is no longer active."}</p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-800 text-slate-200 text-sm hover:bg-slate-700 transition"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <div className="w-full max-w-lg space-y-6 bg-slate-900/90 p-8 rounded-2xl border border-slate-800 backdrop-blur-md shadow-2xl">
        <div className="text-center space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-semibold uppercase tracking-wider">
            Fellowship Invitation
          </span>
          <h1 className="font-serif text-3xl font-bold text-slate-50">{fellowship.name}</h1>
          <p className="text-xs text-slate-400">
            Hosted by <span className="text-slate-200 font-medium">{fellowship.profiles?.full_name || "a Believer"}</span>
          </p>
        </div>

        {fellowship.description && (
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 text-sm text-slate-300 italic text-center">
            &ldquo;{fellowship.description}&rdquo;
          </div>
        )}

        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-950/40 border border-slate-800 text-xs text-slate-300">
            <Users className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Access shared audio/video prayer rooms, study notes, and prayer boards.</span>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-950/40 border border-slate-800 text-xs text-slate-300">
            <Shield className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Private community protected under Supabase Row-Level Security.</span>
          </div>
        </div>

        <div className="pt-4">
          <button
            onClick={handleJoin}
            disabled={joining}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-semibold text-sm shadow-xl shadow-amber-950/40 transition disabled:opacity-50 cursor-pointer"
          >
            {joining ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : alreadyMember ? (
              <>
                <UserCheck className="w-5 h-5 text-slate-950" />
                You are already a member — Open Fellowship
              </>
            ) : user ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-slate-950" />
                Join Fellowship Now
              </>
            ) : (
              <>
                Sign In to Join Fellowship
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
