"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Users, Plus, Loader2 } from "lucide-react";
import CreateFellowshipModal from "@/components/CreateFellowshipModal";
import DashboardNavbar from "@/components/DashboardNavbar";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
        <div className="max-w-md space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto shadow-lg shadow-amber-950/20">
            <Users className="w-8 h-8" />
          </div>

          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-slate-100">
            Welcome, {userProfile?.full_name || "Believer"}
          </h2>

          <p className="text-xs text-slate-400 leading-relaxed">
            You are currently not part of any Cell space. Launch your own Cell or ask your Cell Leader to send you their unique invite link.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => setIsModalOpen(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-semibold text-xs transition shadow-lg shadow-amber-950/30 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Launch New Cell
            </button>
          </div>
        </div>
      </div>

      <CreateFellowshipModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
