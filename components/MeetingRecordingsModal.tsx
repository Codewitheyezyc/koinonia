"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  X, Video, Download, Play, Pause, Loader2,
  Calendar, Trash2, ExternalLink, HardDrive, CheckCircle2
} from "lucide-react";
import { FormattedAuthorName } from "@/components/GuestBadge";

interface RecordingItem {
  id: string;
  fellowship_id: string;
  title: string;
  file_url: string;
  duration_seconds: number;
  file_size_bytes: number;
  created_at: string;
  profiles?: {
    full_name: string;
  };
}

interface MeetingRecordingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  fellowshipId: string;
  fellowshipName: string;
  isHost?: boolean;
}

export default function MeetingRecordingsModal({
  isOpen,
  onClose,
  fellowshipId,
  fellowshipName,
  isHost = false,
}: MeetingRecordingsModalProps) {
  const [recordings, setRecordings] = useState<RecordingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePlaybackUrl, setActivePlaybackUrl] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const supabase = createClient();

  const loadRecordings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("meeting_recordings")
        .select("*, profiles:recorded_by(full_name)")
        .eq("fellowship_id", fellowshipId)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setRecordings(data);
      }
    } catch (err) {
      console.error("Failed to load recordings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && fellowshipId) {
      loadRecordings();
    }
  }, [isOpen, fellowshipId]);

  if (!isOpen) return null;

  // Direct download to local computer disk
  const handleDownloadRecording = async (rec: RecordingItem) => {
    setDownloadingId(rec.id);
    try {
      const response = await fetch(rec.file_url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = blobUrl;
      const cleanTitle = rec.title.toLowerCase().replace(/[^a-z0-9]/g, "-");
      link.download = `${cleanTitle}-${new Date(rec.created_at).toISOString().split("T")[0]}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.warn("Direct blob download fallback to new tab:", err);
      window.open(rec.file_url, "_blank");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleCopyLink = (rec: RecordingItem) => {
    navigator.clipboard.writeText(rec.file_url);
    setCopiedId(rec.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDeleteRecording = async (recId: string) => {
    if (!confirm("Are you sure you want to delete this recorded meeting?")) return;
    try {
      await supabase.from("meeting_recordings").delete().eq("id", recId);
      setRecordings((prev) => prev.filter((r) => r.id !== recId));
      if (activePlaybackUrl === recordings.find((r) => r.id === recId)?.file_url) {
        setActivePlaybackUrl(null);
      }
    } catch (err) {
      console.error("Failed to delete recording:", err);
    }
  };

  const formatDuration = (seconds: number) => {
    if (!seconds) return "Live Meeting";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })} at ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl flex flex-col max-h-[88vh] shadow-2xl overflow-hidden relative">
        
        {/* Header with spacious responsive layout */}
        <div className="p-4 sm:p-6 bg-slate-950/90 border-b border-slate-800 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0 pr-2">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shadow-lg shrink-0 mt-0.5">
              <Video className="w-5 h-5" />
            </div>
            <div className="space-y-1 min-w-0">
              <h2 className="font-serif text-sm sm:text-base font-bold text-slate-100 leading-snug">
                {fellowshipName} — Recordings & Archives
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-400 leading-relaxed">
                Watch past live meetings and download video recordings directly to your computer.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Active Player (if user clicked play) */}
        {activePlaybackUrl && (
          <div className="p-4 bg-slate-950 border-b border-slate-800">
            <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-black aspect-video max-h-64 mx-auto flex items-center justify-center shadow-inner">
              <video
                src={activePlaybackUrl}
                controls
                autoPlay
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        )}

        {/* Recordings List / Empty State */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
              <Loader2 className="w-7 h-7 animate-spin text-amber-500" />
              <p className="text-xs">Loading recorded gatherings...</p>
            </div>
          ) : recordings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-center space-y-4 px-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shadow-xl shadow-amber-950/20">
                <HardDrive className="w-7 h-7" />
              </div>
              <div className="space-y-1.5 max-w-sm">
                <h3 className="font-serif text-base font-bold text-slate-100">No Recorded Meetings Yet</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  When you click <strong className="text-slate-200">&quot;Record&quot;</strong> during any Live Cell Meeting, the full recording will be saved here and available to download directly to your computer.
                </p>
              </div>
            </div>
          ) : (
            recordings.map((rec) => (
              <div
                key={rec.id}
                className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-slate-700/80 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md"
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-serif font-bold text-sm text-slate-100 truncate">{rec.title}</h3>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-semibold">
                      {formatDuration(rec.duration_seconds)}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-slate-400 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      {formatDate(rec.created_at)}
                    </span>
                    {rec.profiles?.full_name && (
                      <span>
                        Recorded by <FormattedAuthorName name={rec.profiles.full_name} className="font-medium text-slate-300" />
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0 pt-1 sm:pt-0">
                  {/* Play Video */}
                  <button
                    onClick={() =>
                      setActivePlaybackUrl(activePlaybackUrl === rec.file_url ? null : rec.file_url)
                    }
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                      activePlaybackUrl === rec.file_url
                        ? "bg-amber-500/20 border-amber-500 text-amber-300"
                        : "bg-slate-900 border-slate-800 text-slate-200 hover:text-amber-400 hover:border-amber-500/40"
                    }`}
                  >
                    {activePlaybackUrl === rec.file_url ? (
                      <><Pause className="w-3.5 h-3.5" /><span>Playing</span></>
                    ) : (
                      <><Play className="w-3.5 h-3.5" /><span>Watch</span></>
                    )}
                  </button>

                  {/* Download to Local Computer */}
                  <button
                    onClick={() => handleDownloadRecording(rec)}
                    disabled={downloadingId === rec.id}
                    title="Download MP4 video to your local computer"
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold text-xs shadow-md transition cursor-pointer disabled:opacity-50"
                  >
                    {downloadingId === rec.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Download className="w-3.5 h-3.5" />
                    )}
                    <span>Download</span>
                  </button>

                  {/* Copy Link */}
                  <button
                    onClick={() => handleCopyLink(rec)}
                    title="Copy recording URL"
                    className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 transition cursor-pointer"
                  >
                    {copiedId === rec.id ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <ExternalLink className="w-3.5 h-3.5" />
                    )}
                  </button>

                  {/* Delete (Host only) */}
                  {isHost && (
                    <button
                      onClick={() => handleDeleteRecording(rec.id)}
                      title="Delete recording"
                      className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-500 hover:text-rose-400 hover:border-rose-900 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
