"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Plus, Hash, BookOpen, Heart, Users, LogOut, User, Sparkles, X, Trash2 } from "lucide-react";
import CreateFellowshipModal from "@/components/CreateFellowshipModal";
import DeleteFellowshipModal from "@/components/DeleteFellowshipModal";
import { FormattedAuthorName } from "@/components/GuestBadge";
import { useMobileSidebar } from "@/lib/context/MobileSidebarContext";
import { useUnreadNotifications } from "@/lib/context/UnreadNotificationContext";

interface Fellowship {
  id: string;
  name: string;
  invite_code: string;
  created_by: string;
  channels?: Channel[];
}

interface Channel {
  id: string;
  name: string;
  type: "chat" | "prayer_board" | "notes";
  fellowship_id: string;
}

interface DashboardSidebarProps {
  currentFellowshipId?: string;
  currentChannelId?: string;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

function DashboardSidebarContent({
  currentFellowshipId,
  currentChannelId,
  isMobileOpen: propIsMobileOpen,
  onMobileClose: propOnMobileClose,
}: DashboardSidebarProps) {
  const { isMobileOpen: contextIsMobileOpen, closeMobileSidebar } = useMobileSidebar();
  const { unreadChannels, markChannelAsRead } = useUnreadNotifications();

  const isMobileOpen = propIsMobileOpen !== undefined ? propIsMobileOpen : contextIsMobileOpen;
  const handleClose = propOnMobileClose || closeMobileSidebar;

  const [fellowships, setFellowships] = useState<Fellowship[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [deletingFellowship, setDeletingFellowship] = useState<Fellowship | null>(null);

  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createClient();

  const pathFellowshipId = pathname.startsWith("/dashboard/fellowship/")
    ? pathname.split("/dashboard/fellowship/")[1]?.split("/")[0]?.split("?")[0]
    : undefined;

  const effectiveFellowshipId = currentFellowshipId || pathFellowshipId;
  const effectiveChannelId = currentChannelId || searchParams.get("channel") || undefined;

  const loadFellowships = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setCurrentUserId(user.id);

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    setUserProfile(profile || { full_name: user.email?.split("@")[0] });

    const { data: memberRows } = await supabase
      .from("fellowship_members")
      .select("fellowships(*)")
      .eq("user_id", user.id);

    if (memberRows) {
      const list = memberRows.map((r: any) => r.fellowships).filter(Boolean);
      setFellowships(list);

      const targetId = effectiveFellowshipId || (list[0] ? list[0].id : null);
      if (targetId) {
        const { data: channelData } = await supabase
          .from("channels")
          .select("*")
          .eq("fellowship_id", targetId)
          .order("created_at", { ascending: true });
        setChannels(channelData || []);
      }
    }
  }, [effectiveFellowshipId, supabase]);

  useEffect(() => {
    loadFellowships();

    const channelId = `sidebar-realtime-${Math.random().toString(36).substring(2, 9)}`;
    const subscription = supabase
      .channel(channelId)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "fellowship_members" },
        () => loadFellowships()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "fellowships" },
        () => loadFellowships()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [loadFellowships, supabase]);

  const handleFellowshipCreated = async (newFellowshipId: string) => {
    await loadFellowships();
    handleClose();
    router.push(`/dashboard/fellowship/${newFellowshipId}`);
  };

  const handleFellowshipDeleted = async () => {
    await loadFellowships();
    setDeletingFellowship(null);
    handleClose();
    router.push("/dashboard");
    router.refresh();
  };

  const activeFellowship = fellowships.find((f) => f.id === effectiveFellowshipId) || fellowships[0];

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const getChannelIcon = (type: string) => {
    switch (type) {
      case "prayer_board":
        return <Heart className="w-4 h-4 text-rose-400 shrink-0" />;
      case "notes":
        return <BookOpen className="w-4 h-4 text-emerald-400 shrink-0" />;
      default:
        return <Hash className="w-4 h-4 text-amber-400 shrink-0" />;
    }
  };

  const renderSidebarContent = () => (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
        <Link href="/dashboard" onClick={handleClose} className="flex items-center gap-2">
          <span className="font-serif text-lg font-bold tracking-[0.15em] text-slate-50 uppercase">
            KOINONIA<span className="text-amber-500 font-extrabold">.</span>
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            title="Create New Fellowship"
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 text-xs font-semibold transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New</span>
          </button>
          <button
            onClick={handleClose}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Cell Selector Bar */}
      <div className="p-3 border-b border-slate-800/60 bg-slate-900/40">
        <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2 px-1">
          <span>Your Cells ({fellowships.length})</span>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="text-amber-400 hover:text-amber-300 font-bold transition cursor-pointer lowercase hover:underline"
          >
            + create
          </button>
        </div>
        {fellowships.length === 0 ? (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="w-full p-2.5 rounded-lg border border-dashed border-slate-800 text-xs text-slate-400 hover:text-amber-400 hover:border-amber-500/50 flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Create First Cell
          </button>
        ) : (
          <div className="space-y-1 max-h-44 overflow-y-auto pr-1">
            {fellowships.map((f) => {
              const isActive = f.id === activeFellowship?.id;
              const isHost = f.created_by === currentUserId;
              return (
                <div
                  key={f.id}
                  className={`group flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
                    isActive
                      ? "bg-slate-800 text-slate-100 border border-slate-700 shadow-sm"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/80"
                  }`}
                >
                  <Link
                    href={`/dashboard/fellowship/${f.id}`}
                    onClick={handleClose}
                    className="flex items-center gap-2 min-w-0 flex-1"
                  >
                    <Users className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-amber-400" : "text-slate-500"}`} />
                    <span className="truncate">{f.name}</span>
                  </Link>

                  {/* Delete button (Host/Creator only) */}
                  {isHost && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingFellowship(f);
                      }}
                      title="Delete Fellowship"
                      className="opacity-60 group-hover:opacity-100 p-1 rounded hover:bg-rose-950/60 hover:text-rose-400 transition cursor-pointer text-slate-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Active Fellowship Channels */}
      <div className="flex-1 p-3 overflow-y-auto space-y-4">
        {activeFellowship && (
          <div>
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2 px-1 flex items-center justify-between">
              <span>Channels — {activeFellowship.name}</span>
            </div>
            <div className="space-y-0.5">
              {(() => {
                const notesCh = channels.find((c) => c.type === "notes");
                const defaultCh = notesCh || channels[0];
                return channels.map((ch) => {
                  const isSelected = ch.id === effectiveChannelId || (!effectiveChannelId && ch.id === defaultCh?.id);
                  const isUnread = unreadChannels[ch.id];
                  return (
                    <Link
                      key={ch.id}
                      href={`/dashboard/fellowship/${activeFellowship.id}?channel=${ch.id}`}
                      onClick={() => {
                        markChannelAsRead(ch.id);
                        handleClose();
                      }}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition ${
                        isSelected
                          ? "bg-amber-600/15 text-amber-300 border border-amber-500/30"
                          : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {getChannelIcon(ch.type)}
                        <span className="capitalize truncate">{ch.name.replace("-", " ")}</span>
                      </div>
                      {isUnread && !isSelected && (
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
                      )}
                    </Link>
                  );
                });
              })()}
            </div>
          </div>
        )}
      </div>

      {/* User Profile & Sign Out Footer */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-900/60 flex items-center justify-between">
        <Link
          href="/dashboard/profile"
          onClick={handleClose}
          className="flex items-center gap-2 text-xs text-slate-300 hover:text-slate-100 transition truncate min-w-0"
        >
          <div className="w-7 h-7 rounded-full bg-amber-600/20 border border-amber-500/40 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0">
            {userProfile?.full_name?.charAt(0).toUpperCase() || "U"}
          </div>
          <FormattedAuthorName name={userProfile?.full_name} className="truncate text-xs font-medium" />
        </Link>

        <button
          onClick={handleSignOut}
          title="Sign Out"
          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-900 transition cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-slate-950 border-r border-slate-800 flex-col justify-between shrink-0 h-screen sticky top-0">
        {renderSidebarContent()}
      </aside>

      {/* Mobile Backdrop & Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
            onClick={handleClose}
          />
          <aside className="relative z-50 w-72 bg-slate-950 h-full border-r border-slate-800 flex flex-col justify-between shadow-2xl">
            {renderSidebarContent()}
          </aside>
        </div>
      )}

      {/* Modals */}
      <CreateFellowshipModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={handleFellowshipCreated}
      />

      {deletingFellowship && (
        <DeleteFellowshipModal
          isOpen={!!deletingFellowship}
          onClose={() => setDeletingFellowship(null)}
          fellowshipId={deletingFellowship.id}
          fellowshipName={deletingFellowship.name}
          onDeleted={handleFellowshipDeleted}
        />
      )}
    </>
  );
}

export default function DashboardSidebar(props: DashboardSidebarProps) {
  return (
    <Suspense fallback={<aside className="hidden md:flex w-64 bg-slate-950 border-r border-slate-800 shrink-0 h-screen sticky top-0" />}>
      <DashboardSidebarContent {...props} />
    </Suspense>
  );
}
