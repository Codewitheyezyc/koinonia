"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Users, Plus, ArrowRight, Loader2, KeyRound } from "lucide-react";
import CreateFellowshipModal from "@/components/CreateFellowshipModal";
import DashboardNavbar from "@/components/DashboardNavbar";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inviteCodeInput, setInviteCodeInput] = useState("");
  const [joiningCode, setJoiningCode] = useState(false);
  const [inputError, setInputError] = useState<string | null>(null);

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function checkUserAndFellowships() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      setUserProfile(profile || { full_name: user.email?.split("@")[0] });

      const { data: memberships } = await supabase
        .from("fellowship_members")
        .select("fellowship_id")
        .eq("user_id", user.id)
        .limit(1);

      if (memberships && memberships.length > 0) {
        router.push(`/dashboard/fellowship/${memberships[0].fellowship_id}`);
      } else {
        setLoading(false);
      }
    }

    checkUserAndFellowships();
  }, [router, supabase]);

  const handleJoinWithCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const raw = inviteCodeInput.trim();
    if (!raw || joiningCode) return;

    setInputError(null);
    setJoiningCode(true);

    try {
      // 1. Parse clean invite code if user pasted a full URL (e.g., https://.../join/a8b9c0)
      let cleanCode = raw;
      if (raw.includes("/join/")) {
        cleanCode = raw.split("/join/")[1]?.split("?")[0]?.split("/")[0] || raw;
      }

      // 2. Query Supabase database to verify cell exists
      const { data: cell, error: cellErr } = await supabase
        .from("fellowships")
        .select("id, name")
        .eq("invite_code", cleanCode)
        .maybeSingle();

      if (cellErr || !cell) {
        setInputError("Cell invite code or link is invalid. Please verify with your Cell Leader.");
        setJoiningCode(false);
        return;
      }

      // 3. Auto-join user to the cell directly
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error: joinErr } = await supabase
          .from("fellowship_members")
          .insert({
            fellowship_id: cell.id,
            user_id: user.id,
            role: "member",
          });

        if (joinErr && !joinErr.message.includes("unique constraint")) {
          console.warn("Auto-join warning:", joinErr);
        }

        router.push(`/dashboard/fellowship/${cell.id}`);
        router.refresh();
      } else {
        router.push(`/join/${cleanCode}`);
      }
    } catch (err: any) {
      console.error("Join with code error:", err);
      setInputError(err.message || "Failed to join Cell. Please try again.");
      setJoiningCode(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-950">
        <Loader2 className="w-7 h-7 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <>
      <DashboardNavbar
        fellowshipName="Cell Ministry Hub"
        channelName="welcome"
      />
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-8 text-center space-y-6 bg-slate-900/20">
        <div className="max-w-md w-full space-y-6">
          <div className="space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto shadow-lg shadow-amber-950/20">
              <Users className="w-8 h-8" />
            </div>

            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-slate-100">
              Welcome, {userProfile?.full_name || "Believer"}
            </h2>

            <p className="text-xs text-slate-400 leading-relaxed">
              You are currently not part of any Cell. Join an existing Cell using your Cell Leader&apos;s invite code/link, or launch your own new Cell space.
            </p>
          </div>

          {/* Join Existing Cell with Code or Link */}
          <form onSubmit={handleJoinWithCode} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 text-left shadow-xl">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
              <KeyRound className="w-4 h-4 text-emerald-400" />
              <span>Join Existing Cell</span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                required
                value={inviteCodeInput}
                onChange={(e) => {
                  setInviteCodeInput(e.target.value);
                  if (inputError) setInputError(null);
                }}
                placeholder="Paste Cell Invite Code or Link"
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
              />
              <button
                type="submit"
                disabled={joiningCode || !inviteCodeInput.trim()}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs transition cursor-pointer disabled:opacity-50 shrink-0"
              >
                {joiningCode ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                <span>Join</span>
              </button>
            </div>

            {inputError && (
              <p className="text-[11px] text-rose-400 bg-rose-950/30 border border-rose-800/40 rounded-lg p-2">{inputError}</p>
            )}
          </form>

          <div className="flex items-center gap-2">
            <div className="flex-1 h-px bg-slate-800" />
            <span className="text-[10px] text-slate-500 uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-slate-800" />
          </div>

          {/* Launch New Cell */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold text-xs transition shadow-lg shadow-amber-950/30 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Launch New Cell Space</span>
          </button>
        </div>
      </div>

      <CreateFellowshipModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
