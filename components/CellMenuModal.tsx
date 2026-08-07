"use client";

import Link from "next/link";
import {
  X, Video, Plus, Trash2, HardDrive, User, LogOut
} from "lucide-react";
import { FormattedAuthorName } from "@/components/GuestBadge";

interface CellMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  fellowshipId?: string;
  fellowshipName?: string;
  userProfile: any;
  isHost: boolean;
  onOpenCreateCell: () => void;
  onOpenDeleteCell: () => void;
  onOpenRecordings: () => void;
  onSignOut: () => void;
}

export default function CellMenuModal({
  isOpen,
  onClose,
  fellowshipId,
  fellowshipName = "Cell Ministry",
  userProfile,
  isHost,
  onOpenCreateCell,
  onOpenDeleteCell,
  onOpenRecordings,
  onSignOut,
}: CellMenuModalProps) {
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
        {/* Modal Header & User Card */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/30 border border-amber-500/40 text-amber-400 flex items-center justify-center font-bold text-sm shadow-md shrink-0">
              {userProfile?.full_name?.charAt(0).toUpperCase() || <User className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <FormattedAuthorName
                name={userProfile?.full_name}
                className="font-bold text-slate-100 text-sm truncate"
              />
              <p className="text-[11px] text-slate-400 truncate">
                {isHost ? "Cell Leader / Host" : "Active Member"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Primary Cell Tools */}
        <div className="space-y-2">
          {/* Recordings & Archives with Direct Local Download */}
          {fellowshipId && (
            <button
              onClick={() => {
                onClose();
                onOpenRecordings();
              }}
              className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-amber-500/40 hover:bg-slate-800/50 text-slate-200 transition cursor-pointer group"
            >
              <div className="flex items-center gap-3 text-xs font-semibold">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shadow-sm">
                  <HardDrive className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-slate-100">Meeting Recordings & Archives</p>
                  <p className="text-[10px] text-slate-400">Stream & download past live meetings</p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-amber-400 group-hover:translate-x-0.5 transition-transform">
                Open →
              </span>
            </button>
          )}

          {/* Launch New Cell */}
          <button
            onClick={() => {
              onClose();
              onOpenCreateCell();
            }}
            className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-amber-500/40 hover:bg-slate-800/50 text-slate-200 transition cursor-pointer group"
          >
            <div className="flex items-center gap-3 text-xs font-semibold">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shadow-sm">
                <Plus className="w-4 h-4" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-slate-100">Launch New Cell Space</p>
                <p className="text-[10px] text-slate-400">Start a dedicated prayer or word group</p>
              </div>
            </div>
            <span className="text-[10px] font-bold text-amber-400 group-hover:translate-x-0.5 transition-transform">
              New →
            </span>
          </button>
        </div>

        {/* Account & Management Actions */}
        <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
          {/* Delete Cell (Host Only) */}
          {isHost && fellowshipId && (
            <button
              onClick={() => {
                onClose();
                onOpenDeleteCell();
              }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-rose-400 hover:bg-rose-500/10 font-semibold transition cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete This Cell Space</span>
            </button>
          )}

          {/* Profile Settings */}
          <Link
            href="/dashboard/profile"
            onClick={onClose}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-300 hover:text-slate-100 hover:bg-slate-800 font-medium transition cursor-pointer"
          >
            <User className="w-4 h-4" />
            <span>Profile Settings</span>
          </Link>

          {/* Sign Out */}
          <button
            onClick={() => {
              onClose();
              onSignOut();
            }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-rose-400 hover:bg-slate-800 font-medium transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
