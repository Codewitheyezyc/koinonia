"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Pause, Download, Volume2, Loader2 } from "lucide-react";

interface VoiceNotePlayerProps {
  audioUrl: string;
  durationSeconds?: number;
  isMe?: boolean;
}

export default function VoiceNotePlayer({
  audioUrl,
  durationSeconds,
  isMe = false,
}: VoiceNotePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(durationSeconds || 0);
  const [downloading, setDownloading] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const setAudioDuration = () => {
      if (audio.duration && !isNaN(audio.duration) && audio.duration !== Infinity) {
        setDuration(audio.duration);
      }
    };
    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", setAudioDuration);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", setAudioDuration);
      audio.removeEventListener("ended", onEnded);
      audio.pause();
    };
  }, [audioUrl]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(console.error);
    }
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setDownloading(true);
    try {
      const response = await fetch(audioUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `koinonia-voice-prayer-${Date.now()}.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      window.open(audioUrl, "_blank");
    } finally {
      setDownloading(false);
    }
  };

  const formatSecs = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${mins}:${s < 10 ? "0" : ""}${s}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Visual decorative waveform bars
  const waveHeights = [40, 65, 85, 50, 90, 70, 45, 80, 100, 60, 75, 45, 90, 65, 80, 50, 70, 85];

  return (
    <div
      className={`p-3 rounded-2xl border flex flex-col gap-2 min-w-[240px] max-w-sm shadow-md transition ${
        isMe
          ? "bg-amber-950/40 border-amber-500/40 text-amber-100"
          : "bg-slate-900/90 border-slate-800 text-slate-200"
      }`}
    >
      <div className="flex items-center gap-3">
        {/* Play/Pause Button */}
        <button
          type="button"
          onClick={togglePlay}
          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition shadow-lg shrink-0 cursor-pointer ${
            isMe
              ? "bg-amber-500 text-slate-950 hover:bg-amber-400"
              : "bg-amber-600/20 border border-amber-500/50 text-amber-300 hover:bg-amber-500 hover:text-slate-950"
          }`}
        >
          {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
        </button>

        {/* Animated Waveform Visualizer */}
        <div className="flex-1 flex items-center gap-1 h-8 cursor-pointer" onClick={togglePlay}>
          {waveHeights.map((h, i) => {
            const barProgress = (i / waveHeights.length) * 100;
            const isPassed = progressPercent >= barProgress;
            return (
              <div
                key={i}
                style={{ height: `${h}%` }}
                className={`flex-1 rounded-full transition-all duration-150 ${
                  isPassed
                    ? "bg-amber-400"
                    : isMe
                    ? "bg-amber-800/60"
                    : "bg-slate-700/80"
                } ${isPlaying && isPassed ? "animate-pulse" : ""}`}
              />
            );
          })}
        </div>

        {/* Download Audio */}
        <button
          type="button"
          onClick={handleDownload}
          disabled={downloading}
          title="Download voice prayer to computer"
          className="p-2 rounded-xl text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition cursor-pointer shrink-0"
        >
          {downloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Duration & Time text */}
      <div className="flex items-center justify-between text-[10px] font-mono opacity-80 px-1">
        <span className="flex items-center gap-1">
          <Volume2 className="w-3 h-3 text-amber-400" />
          <span>Spoken Prayer / Voice Note</span>
        </span>
        <span>
          {formatSecs(currentTime)} / {formatSecs(duration)}
        </span>
      </div>
    </div>
  );
}
