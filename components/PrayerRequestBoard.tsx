"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Heart, Plus, CheckCircle2, Sparkles, Loader2, MessageSquare, ShieldAlert, Award } from "lucide-react";

interface PrayerRequest {
  id: string;
  fellowship_id: string;
  user_id: string;
  title: string;
  description?: string;
  status: "active" | "answered";
  created_at: string;
  profiles?: {
    full_name: string;
    avatar_url?: string;
  };
  intercessions_count?: number;
  user_has_prayed?: boolean;
}

export default function PrayerRequestBoard({ fellowshipId }: { fellowshipId: string }) {
  const [requests, setRequests] = useState<PrayerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const supabase = createClient();

  const loadPrayerRequests = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);

    // Fetch prayer requests for fellowship
    const { data: reqData, error } = await supabase
      .from("prayer_requests")
      .select("*, profiles:user_id(full_name, avatar_url)")
      .eq("fellowship_id", fellowshipId)
      .order("created_at", { ascending: false });

    if (!error && reqData) {
      // For each request, count intercessions and check if current user prayed
      const enriched = await Promise.all(
        reqData.map(async (req) => {
          const { count } = await supabase
            .from("intercessions")
            .select("id", { count: "exact", head: true })
            .eq("prayer_request_id", req.id);

          let hasPrayed = false;
          if (user) {
            const { data: userPrayed } = await supabase
              .from("intercessions")
              .select("id")
              .eq("prayer_request_id", req.id)
              .eq("user_id", user.id)
              .maybeSingle();
            hasPrayed = !!userPrayed;
          }

          return {
            ...req,
            intercessions_count: count || 0,
            user_has_prayed: hasPrayed,
          };
        })
      );
      setRequests(enriched);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadPrayerRequests();
  }, [fellowshipId]);

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || submitting || !currentUser) return;

    setSubmitting(true);
    try {
      const { error } = await supabase.from("prayer_requests").insert({
        fellowship_id: fellowshipId,
        user_id: currentUser.id,
        title: title.trim(),
        description: description.trim(),
        status: "active",
      });

      if (error) throw error;

      setTitle("");
      setDescription("");
      setIsModalOpen(false);
      loadPrayerRequests();
    } catch (err: any) {
      console.error("Failed to post prayer request:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleIntercede = async (reqId: string, currentlyPrayed: boolean) => {
    if (!currentUser) return;

    // Optimistic UI update
    setRequests((prev) =>
      prev.map((r) => {
        if (r.id === reqId) {
          const nextHasPrayed = !currentlyPrayed;
          const nextCount = nextHasPrayed
            ? (r.intercessions_count || 0) + 1
            : Math.max(0, (r.intercessions_count || 0) - 1);
          return { ...r, user_has_prayed: nextHasPrayed, intercessions_count: nextCount };
        }
        return r;
      })
    );

    if (currentlyPrayed) {
      await supabase
        .from("intercessions")
        .delete()
        .eq("prayer_request_id", reqId)
        .eq("user_id", currentUser.id);
    } else {
      await supabase
        .from("intercessions")
        .insert({
          prayer_request_id: reqId,
          user_id: currentUser.id,
        });
    }
  };

  const handleToggleStatus = async (reqId: string, currentStatus: "active" | "answered") => {
    const nextStatus = currentStatus === "active" ? "answered" : "active";

    setRequests((prev) =>
      prev.map((r) => (r.id === reqId ? { ...r, status: nextStatus } : r))
    );

    await supabase
      .from("prayer_requests")
      .update({ status: nextStatus, updated_at: new Date().toISOString() })
      .eq("id", reqId);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-24 md:pb-8 space-y-6 bg-slate-900/30">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div className="space-y-1">
          <h2 className="font-serif text-lg sm:text-xl font-bold text-slate-100 flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-400 shrink-0" />
            Prayer Request Board
          </h2>
          <p className="text-xs text-slate-400">
            Post intercession requests and join your brothers and sisters in prayer.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 text-xs font-bold shadow-lg shadow-amber-950/30 transition cursor-pointer shrink-0 whitespace-nowrap"
        >
          <Plus className="w-4 h-4 shrink-0" />
          <span>Submit Prayer Request</span>
        </button>
      </div>

      {/* Requests List */}
      {loading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
        </div>
      ) : requests.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-slate-800 rounded-2xl space-y-3">
          <Sparkles className="w-8 h-8 text-amber-500/40 mx-auto" />
          <h3 className="font-serif text-base font-semibold text-slate-300">No Prayer Requests Yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Be the first to share a prayer need with your fellowship. Technology is here to help us carry one another&apos;s burdens.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {requests.map((req) => {
            const isAnswered = req.status === "answered";
            const isAuthor = req.user_id === currentUser?.id;

            return (
              <div
                key={req.id}
                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 ${
                  isAnswered
                    ? "bg-gradient-to-br from-amber-950/20 via-slate-900/90 to-emerald-950/20 border-amber-500/40 shadow-lg shadow-amber-950/20"
                    : "bg-slate-900/80 border-slate-800 hover:border-slate-700"
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-800 text-amber-400 flex items-center justify-center font-bold text-[10px]">
                        {req.profiles?.full_name?.charAt(0).toUpperCase() || "U"}
                      </div>
                      <span className="text-xs font-semibold text-slate-300">
                        {req.profiles?.full_name || "Believer"}
                      </span>
                    </div>

                    {isAnswered && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-semibold uppercase tracking-wide">
                        <Award className="w-3 h-3" /> Testimony / Answered
                      </span>
                    )}
                  </div>

                  <h3 className="font-serif text-base font-bold text-slate-100">{req.title}</h3>
                  {req.description && (
                    <p className="text-xs text-slate-300 leading-relaxed">{req.description}</p>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs">
                  <button
                    onClick={() => handleIntercede(req.id, !!req.user_has_prayed)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border font-medium transition cursor-pointer ${
                      req.user_has_prayed
                        ? "bg-rose-950/60 border-rose-800/80 text-rose-300"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-900"
                    }`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${req.user_has_prayed ? "fill-rose-400 text-rose-400" : ""}`} />
                    <span>{req.user_has_prayed ? "Prayed" : "I Prayed for This"}</span>
                    <span className="ml-1 px-1.5 py-0.2 bg-slate-800 rounded-md text-[10px] font-mono text-slate-200">
                      {req.intercessions_count}
                    </span>
                  </button>

                  {isAuthor && (
                    <button
                      onClick={() => handleToggleStatus(req.id, req.status)}
                      className="text-[11px] text-slate-400 hover:text-amber-400 underline transition cursor-pointer"
                    >
                      {isAnswered ? "Mark Active" : "Mark as Testimony"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Prayer Request Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="font-serif text-lg font-bold text-slate-100">Submit Prayer Request</h3>
            <form onSubmit={handleCreateRequest} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Prayer Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Healing for my mother's surgery"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Details / Specific Intercession Points</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Share details so your fellowship can intercede accurately..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-slate-950 text-xs font-semibold flex items-center gap-1.5"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
