"use client";

import { useState } from "react";
import Link from "next/link";
import {
  X, Video, BookOpen, Plus, Trash2, Share2, Copy, Check,
  HardDrive, User, LogOut, Sparkles, Shield
} from "lucide-react";
import GuestBadge, { FormattedAuthorName } from "@/components/GuestBadge";

interface CellMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  fellowshipId?: string;
  fellowshipName?: string;
  inviteCode?: string;
  userProfile: any;
  isHost: boolean;
  onOpenCreateCell: () => void;
  onOpenDeleteCell: () => void;
  onOpenRecordings: () => void;
  onOpenBible?: () => void;
  onSignOut: () => void;
}

export default function CellMenuModal({
  isOpen,
  onClose,
  fellowshipId,
  fellowshipName = "Cell Ministry",
  inviteCode,
  userProfile,
  isHost,
  onOpenCreateCell,
  onOpenDeleteCell,
  onOpenRecordings,
  onOpenBible,
  onSignOut,
}: CellMenuModalProps) {
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [copiedMeeting, setCopiedMeeting] = useState(false);

  if (!isOpen) return null;

  const copyCellInvite = () => {
    if (!inviteCode) return;
    const link = `${window.location.origin}/join/${inviteCode}`;
    navigator.clipboard.writeText(link);
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 2000);
  };

  const copyMeetingLink = () => {
    if (!fellowshipId) return;
    const link = `${window.location.origin}/meeting/${fellowshipId}`;
    navigator.clipboard.writeText(link);
    setCopiedMeeting(true);
    setTimeout(() => setCopiedMeeting(false), 2000);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150"
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

        {/* Cell Quick Actions Grid */}
        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-1">
            Cell Tools & Features
          </p>

          {/* 1. Recordings & Archives */}
          {fellowshipId && (
            <button
              onClick={() => {
                onClose();
                onOpenRecordings();
              }}
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-slate-800/90 hover:border-amber-500/40 hover:bg-slate-800/50 text-slate-200 transition cursor-pointer group"
            >
              <div className="flex items-center gap-2.5 text-xs font-semibold">
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                  <HardDrive className="w-4 h-4" />
                </div>
                <span>Meeting Recordings & Archives</span>
              </div>
              <span className="text-[10px] font-bold text-amber-400 group-hover:translate-x-0.5 transition-transform">
                Download →
              </span>
            </button>
          )}

          {/* 2. Parallel Scripture Reader */}
          {onOpenBible && (
            <button
              onClick={() => {
                onClose();
                onOpenBible();
              }}
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-slate-800/90 hover:border-amber-500/40 hover:bg-slate-800/50 text-slate-200 transition cursor-pointer group"
            >
              <div className="flex items-center gap-2.5 text-xs font-semibold">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <BookOpen className="w-4 h-4" />
                </div>
                <span>Parallel Scripture Reader</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-400 group-hover:translate-x-0.5 transition-transform">
                Read →
              </span>
            </button>
          )}

          {/* 3. Copy Cell Invite Link */}
          {inviteCode && (
            <button
              onClick={copyCellInvite}
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-slate-800/90 hover:border-amber-500/40 hover:bg-slate-800/50 text-slate-200 transition cursor-pointer"
            >
              <div className="flex items-center gap-2.5 text-xs font-semibold">
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                  {copiedInvite ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
                </div>
                <span>Copy Cell Invite Link</span>
              </div>
              <span className="text-[10px] text-slate-400">
                {copiedInvite ? "Copied!" : "For Members"}
              </span>
            </button>
          )}

          {/* 4. Copy Live Meeting Link */}
          {fellowshipId && (
            <button
              onClick={copyMeetingLink}
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-slate-800/90 hover:border-emerald-500/40 hover:bg-slate-800/50 text-slate-200 transition cursor-pointer"
            >
              <div className="flex items-center gap-2.5 text-xs font-semibold">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  {copiedMeeting ? <Check className="w-4 h-4 text-emerald-400" /> : <Video className="w-4 h-4" />}
                </div>
                <span>Copy Call Link (1-Click Guest)</span>
              </div>
              <span className="text-[10px] text-slate-400">
                {copiedMeeting ? "Copied!" : "For Guests"}
              </span>
            </button>
          )}
        </div>

        {/* Management & Account Actions */}
        <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
          {/* Create New Cell */}
          <button
            onClick={() => {
              onClose();
              onOpenCreateCell();
            }}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs text-amber-400 hover:bg-amber-500/10 font-semibold transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Launch New Cell Space</span>
          </button>

          {/* Delete Cell (Host Only) */}
          {isHost && fellowshipId && (
            <button
              onClick={() => {
                onClose();
                onOpenDeleteCell();
              }}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs text-rose-400 hover:bg-rose-500/10 font-semibold transition cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete This Cell</span>
            </button>
          )}

          {/* Profile Settings */}
          <Link
            href="/dashboard/profile"
            onClick={onClose}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs text-slate-300 hover:text-slate-100 hover:bg-slate-800 font-medium transition cursor-pointer"
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
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs text-slate-400 hover:text-rose-400 hover:bg-slate-800 font-medium transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
