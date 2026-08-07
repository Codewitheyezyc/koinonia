"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Trash2, AlertTriangle, Loader2, X } from "lucide-react";

interface DeleteFellowshipModalProps {
  isOpen: boolean;
  onClose: () => void;
  fellowshipId: string;
  fellowshipName: string;
  onDeleted?: () => void;
}

export default function DeleteFellowshipModal({
  isOpen,
  onClose,
  fellowshipId,
  fellowshipName,
  onDeleted,
}: DeleteFellowshipModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const supabase = createClient();

  if (!isOpen) return null;

  const handleDelete = async () => {
    setLoading(true);
    setError(null);

    try {
      const { error: deleteErr } = await supabase
        .from("fellowships")
        .delete()
        .eq("id", fellowshipId);

      if (deleteErr) throw deleteErr;

      onClose();
      if (onDeleted) {
        onDeleted();
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err: any) {
      console.error("Delete cell error:", err);
      setError(err.message || "Failed to delete Cell. Make sure you are the leader.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center shrink-0">
            <Trash2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-serif text-lg font-bold text-slate-100">Delete Cell</h3>
            <p className="text-xs text-rose-400 font-semibold">{fellowshipName}</p>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 space-y-2">
          <div className="flex items-center gap-2 text-amber-400 font-semibold">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Warning: Permanent Action</span>
          </div>
          <p className="text-slate-400 leading-relaxed">
            Deleting this Cell will permanently remove all associated chat messages, prayer boards, scripture study notes, and member access.
          </p>
        </div>

        {error && (
          <p className="text-xs text-rose-400 bg-rose-950/40 border border-rose-800/40 rounded-lg p-2.5">
            {error}
          </p>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition shadow-lg shadow-rose-950/50 cursor-pointer disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            <span>Delete Cell</span>
          </button>
        </div>
      </div>
    </div>
  );
}
