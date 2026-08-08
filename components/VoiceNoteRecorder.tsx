"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Square, Trash2, Send, Loader2 } from "lucide-react";

interface VoiceNoteRecorderProps {
  onSendAudio: (audioBlob: Blob, durationSeconds: number) => Promise<void>;
  onCancel: () => void;
}

export default function VoiceNoteRecorder({
  onSendAudio,
  onCancel,
}: VoiceNoteRecorderProps) {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [uploading, setUploading] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    startRecording();

    return () => {
      stopAndCleanup();
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.start(100);
      setRecording(true);
      setSeconds(0);

      timerRef.current = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error("Microphone access denied:", err);
      alert("Please allow microphone access to record voice prayers & audio notes.");
      onCancel();
    }
  };

  const stopAndCleanup = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
    }
  };

  const handleSend = async () => {
    if (!mediaRecorderRef.current) return;
    setUploading(true);

    const finalDuration = seconds;
    stopAndCleanup();

    // Allow time for last dataavailable chunk
    setTimeout(async () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      try {
        await onSendAudio(blob, finalDuration);
      } catch (err) {
        console.error("Failed to send audio:", err);
      } finally {
        setUploading(false);
      }
    }, 200);
  };

  const handleCancelRecording = () => {
    stopAndCleanup();
    onCancel();
  };

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="flex items-center justify-between gap-3 p-2.5 bg-slate-900 border border-amber-500/40 rounded-2xl animate-in slide-in-from-bottom-2 duration-150 shadow-xl">
      {/* Live recording indicator */}
      <div className="flex items-center gap-2.5 pl-2">
        <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
        <span className="text-xs font-semibold text-rose-400">Recording Spoken Prayer...</span>
        <span className="font-mono text-xs font-bold text-slate-100 bg-slate-950 px-2.5 py-0.5 rounded-full border border-slate-800">
          {formatTimer(seconds)}
        </span>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        {/* Cancel / Trash */}
        <button
          type="button"
          onClick={handleCancelRecording}
          disabled={uploading}
          title="Cancel recording"
          className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition cursor-pointer"
        >
          <Trash2 className="w-4 h-4" />
        </button>

        {/* Send Button */}
        <button
          type="button"
          onClick={handleSend}
          disabled={uploading || seconds < 1}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold text-xs shadow-md transition cursor-pointer disabled:opacity-40"
        >
          {uploading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Send className="w-3.5 h-3.5" />
          )}
          <span>{uploading ? "Sending..." : "Send Voice Note"}</span>
        </button>
      </div>
    </div>
  );
}
