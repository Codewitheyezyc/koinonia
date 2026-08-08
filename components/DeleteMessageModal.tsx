"use client";

import { Trash2, UserX, X } from "lucide-react";

interface DeleteMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  canDeleteForEveryone: boolean;
  onDeleteForEveryone: () => void;
  onDeleteForMe: () => void;
}

export default function DeleteMessageModal({
  isOpen,
  onClose,
  canDeleteForEveryone,
  onDeleteForEveryone,
  onDeleteForMe,
}: DeleteMessageModalProps) {
  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150"
      >
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <h3 className="font-serif font-bold text-sm text-slate-100 flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-rose-400" />
            <span>Delete Message?</span>
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          Choose whether you want to delete this message for all cell members or remove it only from your view.
        </p>

        <div className="space-y-2 pt-1">
          {/* Delete for Everyone */}
          {canDeleteForEveryone && (
            <button
              onClick={() => {
                onDeleteForEveryone();
                onClose();
              }}
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-rose-950/40 border border-rose-800/80 hover:bg-rose-900/50 text-rose-300 font-semibold text-xs transition cursor-pointer shadow-md"
            >
              <div className="flex items-center gap-2.5">
                <Trash2 className="w-4 h-4 text-rose-400 shrink-0" />
                <span>Delete for Everyone</span>
              </div>
              <span className="text-[10px] text-rose-400/80">For All Members</span>
            </button>
          )}

          {/* Delete for Me */}
          <button
            onClick={() => {
              onDeleteForMe();
              onClose();
            }}
            className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-950/70 border border-slate-800 hover:bg-slate-800/60 text-slate-200 font-semibold text-xs transition cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <UserX className="w-4 h-4 text-slate-400 shrink-0" />
              <span>Delete for Me</span>
            </div>
            <span className="text-[10px] text-slate-500">Only My Device</span>
          </button>
        </div>

        <div className="pt-1 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-slate-100 text-xs font-medium transition cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
