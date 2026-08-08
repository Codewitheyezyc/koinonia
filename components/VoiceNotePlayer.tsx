"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Pause, Download, Loader2 } from "lucide-react";

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

  // Ultra-clean 14-bar sound wave heights
  const waveHeights = [30, 60, 90, 45, 80, 100, 70, 50, 85, 95, 60, 40, 75, 55];

  return (
    <div
      className={`p-2 rounded-2xl flex items-center gap-2 max-w-[230px] sm:max-w-[260px] select-none transition ${
        isMe ? "text-amber-100" : "text-slate-200"
      }`}
    >
      {/* Small circular play button */}
      <button
        type="button"
        onClick={togglePlay}
        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold transition shrink-0 cursor-pointer shadow-md ${
          isMe
            ? "bg-amber-500 text-slate-950 hover:bg-amber-400"
            : "bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500 hover:text-slate-950"
        }`}
      >
        {isPlaying ? (
          <Pause className="w-3.5 h-3.5 fill-current" />
        ) : (
          <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
        )}
      </button>

      {/* Sleek Waveform track */}
      <div
        className="flex-1 flex items-center gap-0.5 h-6 cursor-pointer min-w-[90px]"
        onClick={togglePlay}
      >
        {waveHeights.map((h, i) => {
          const barProgress = (i / waveHeights.length) * 100;
          const isPassed = progressPercent >= barProgress;
          return (
            <div
              key={i}
              style={{ height: `${h}%` }}
              className={`w-1 rounded-full transition-all duration-100 ${
                isPassed
                  ? isMe
                    ? "bg-amber-300"
                    : "bg-amber-400"
                  : isMe
                  ? "bg-amber-800/40"
                  : "bg-slate-700/60"
              }`}
            />
          );
        })}
      </div>

      {/* Duration text */}
      <span className="font-mono text-[10px] font-semibold opacity-90 shrink-0">
        {formatSecs(isPlaying ? currentTime : duration)}
      </span>

      {/* Download button */}
      <button
        type="button"
        onClick={handleDownload}
        disabled={downloading}
        title="Download audio"
        className="p-1 text-slate-400 hover:text-amber-400 transition cursor-pointer shrink-0"
      >
        {downloading ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <Download className="w-3 h-3" />
        )}
      </button>
    </div>
  );
}
