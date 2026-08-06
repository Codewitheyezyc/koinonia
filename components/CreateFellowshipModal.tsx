"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { X, Plus, Users, Lock, Globe, Copy, Check, Loader2 } from "lucide-react";

interface CreateFellowshipModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (newFellowshipId: string) => void;
}

export default function CreateFellowshipModal({ isOpen, onClose, onCreated }: CreateFellowshipModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [createdInviteCode, setCreatedInviteCode] = useState<string | null>(null);
  const [createdFellowshipId, setCreatedFellowshipId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const supabase = createClient();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("You must be logged in to create a fellowship.");

      const { data, error: insertError } = await supabase
        .from("fellowships")
        .insert({
          name,
          description,
          created_by: user.id,
          is_private: isPrivate,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setCreatedInviteCode(data.invite_code);
      setCreatedFellowshipId(data.id);

      if (onCreated) {
        onCreated(data.id);
      }
    } catch (err: any) {
      setError(err.message || "Failed to create fellowship.");
    } finally {
      setLoading(false);
    }
  };

  const copyInviteLink = () => {
    if (!createdInviteCode) return;
    const link = `${window.location.origin}/join/${createdInviteCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFinish = () => {
    const targetId = createdFellowshipId;
    onClose();
    setName("");
    setDescription("");
    setCreatedInviteCode(null);
    setCreatedFellowshipId(null);
    if (targetId) {
      router.push(`/dashboard/fellowship/${targetId}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6 relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-200 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {!createdInviteCode ? (
          <>
            <div className="space-y-1">
              <h3 className="font-serif text-xl font-bold text-slate-100">Create New Fellowship</h3>
              <p className="text-xs text-slate-400">Launch a dedicated space for your prayer group or Bible study.</p>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-rose-950/50 border border-rose-800 text-xs text-rose-300">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Fellowship Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Morning Prayer Watch"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Purpose / Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Gathering every Tuesday at 7 PM for intercession and scripture study."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 transition resize-none"
                />
              </div>

              <div className="pt-1">
                <label className="block text-xs font-medium text-slate-300 mb-2">Privacy Setting</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setIsPrivate(false)}
                    className={`flex items-center gap-2 p-3 rounded-lg border text-xs font-medium text-left transition ${
                      !isPrivate
                        ? "bg-amber-600/10 border-amber-500/80 text-amber-400"
                        : "bg-slate-950 border-slate-800 text-slate-400"
                    }`}
                  >
                    <Globe className="w-4 h-4 shrink-0" />
                    <div>
                      <div className="font-semibold">Invite Link</div>
                      <div className="text-[10px] text-slate-400 font-normal">Anyone with link can join</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsPrivate(true)}
                    className={`flex items-center gap-2 p-3 rounded-lg border text-xs font-medium text-left transition ${
                      isPrivate
                        ? "bg-amber-600/10 border-amber-500/80 text-amber-400"
                        : "bg-slate-950 border-slate-800 text-slate-400"
                    }`}
                  >
                    <Lock className="w-4 h-4 shrink-0" />
                    <div>
                      <div className="font-semibold">Private Group</div>
                      <div className="text-[10px] text-slate-400 font-normal">Host approval required</div>
                    </div>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-semibold text-sm transition disabled:opacity-50 cursor-pointer"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Launch Fellowship"}
              </button>
            </form>
          </>
        ) : (
          <div className="text-center space-y-4 py-2">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
              <Check className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="font-serif text-xl font-bold text-slate-100">Fellowship Created!</h3>
              <p className="text-xs text-slate-400">Share your unique invite link with members to gather.</p>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between gap-2">
              <span className="text-xs font-mono text-slate-300 truncate">
                {window.location.origin}/join/{createdInviteCode}
              </span>
              <button
                onClick={copyInviteLink}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-600 hover:bg-amber-500 text-slate-950 text-xs font-semibold shrink-0 transition"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copied" : "Copy Link"}
              </button>
            </div>

            <button
              onClick={handleFinish}
              className="w-full py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition"
            >
              Go to Fellowship Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
