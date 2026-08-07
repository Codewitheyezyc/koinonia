"use client";

import { useEffect, useState } from "react";
import { X, Download, ExternalLink, Loader2, Sparkles } from "lucide-react";

interface ImageLightboxModalProps {
  imageUrl: string | null;
  imageAlt?: string;
  onClose: () => void;
}

export default function ImageLightboxModal({
  imageUrl,
  imageAlt = "Shared image",
  onClose,
}: ImageLightboxModalProps) {
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!imageUrl) return null;

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setDownloading(true);
    try {
      // Fetch image blob to force direct local computer download
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = blobUrl;
      const extension = imageUrl.split(".").pop()?.split("?")[0] || "jpg";
      link.download = `koinonia-image-${Date.now()}.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.warn("Direct blob download fallback to new window:", err);
      window.open(imageUrl, "_blank");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 sm:p-8 animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-5xl max-h-[90vh] w-full flex flex-col items-center justify-center space-y-3"
      >
        {/* Top Control Bar */}
        <div className="w-full flex items-center justify-between px-2 text-slate-300">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="truncate max-w-xs">{imageAlt}</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Download Button */}
            <button
              onClick={handleDownload}
              disabled={downloading}
              title="Download image to your computer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 hover:text-amber-400 hover:border-amber-500/50 text-xs font-semibold transition cursor-pointer shadow-lg"
            >
              {downloading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>Download</span>
            </button>

            {/* Open Original in New Tab */}
            <a
              href={imageUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Open full resolution in new tab"
              className="p-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-slate-100 hover:bg-slate-800 transition cursor-pointer shadow-lg"
            >
              <ExternalLink className="w-4 h-4" />
            </a>

            {/* Close Button */}
            <button
              onClick={onClose}
              title="Close viewer"
              className="p-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-rose-400 hover:bg-slate-800 transition cursor-pointer shadow-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Image Display */}
        <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-900/60 shadow-2xl flex items-center justify-center max-h-[80vh]">
          <img
            src={imageUrl}
            alt={imageAlt}
            className="max-h-[78vh] w-auto max-w-full object-contain rounded-2xl select-none"
          />
        </div>
      </div>
    </div>
  );
}
