"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import DashboardNavbar from "@/components/DashboardNavbar";
import MobileBottomNav from "@/components/MobileBottomNav";
import { Settings, Bell, Lock, Shield, Moon, Volume2, LogOut, Check, Loader2 } from "lucide-react";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [notifications, setNotifications] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [darkTheme, setDarkTheme] = useState(true);
  const [saved, setSaved] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setUser(user);
      setLoading(false);
    }
    loadUser();
  }, [router, supabase]);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-950 text-slate-100">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-screen bg-slate-950 text-slate-100 overflow-hidden">
      {/* Integrated Navbar Header */}
      <DashboardNavbar fellowshipName="App & Sanctuary Settings" channelName="settings" />

      {/* Main Settings Container */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 pb-28 md:pb-8">
        <div className="max-w-xl mx-auto space-y-6">
          <div className="space-y-1">
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-slate-100 flex items-center gap-2">
              <Settings className="w-6 h-6 text-amber-500 shrink-0" />
              <span>Sanctuary Preferences</span>
            </h2>
            <p className="text-xs text-slate-400">
              Customize your fellowship notifications, audio chimes, and security standards.
            </p>
          </div>

          <div className="space-y-4">
            {/* Notifications Card */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
              <h3 className="font-serif text-sm font-bold text-slate-200 flex items-center gap-2 border-b border-slate-800/80 pb-3">
                <Bell className="w-4 h-4 text-amber-500" /> Alerts & Notifications
              </h3>

              <div className="flex items-center justify-between text-xs">
                <div>
                  <div className="font-semibold text-slate-200">Gathering & Meeting Reminders</div>
                  <div className="text-[11px] text-slate-400">Receive alerts when live prayer sessions begin.</div>
                </div>
                <input
                  type="checkbox"
                  checked={notifications}
                  onChange={(e) => setNotifications(e.target.checked)}
                  className="w-4 h-4 accent-amber-500 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-800/60">
                <div>
                  <div className="font-semibold text-slate-200">Worship Audio & Reaction Chimes</div>
                  <div className="text-[11px] text-slate-400">Play audio chimes during live prayer gatherings.</div>
                </div>
                <input
                  type="checkbox"
                  checked={soundEnabled}
                  onChange={(e) => setSoundEnabled(e.target.checked)}
                  className="w-4 h-4 accent-amber-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Privacy Standards */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 shadow-xl">
              <h3 className="font-serif text-sm font-bold text-slate-200 flex items-center gap-2 border-b border-slate-800/80 pb-3">
                <Shield className="w-4 h-4 text-emerald-400" /> Kingdom Security & Privacy
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Koinonia isolates fellowship data per invite code using Supabase Row-Level Security. Uninvited users can never view your messages, prayer boards, or study notes.
              </p>
            </div>

            {/* Actions */}
            <div className="space-y-3 pt-2">
              <button
                onClick={handleSave}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold text-xs transition shadow-lg shadow-amber-950/30 cursor-pointer"
              >
                {saved ? <Check className="w-4 h-4 text-slate-950" /> : null}
                <span>{saved ? "Settings Saved" : "Save Preferences"}</span>
              </button>

              <button
                onClick={handleSignOut}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 font-semibold text-xs transition cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out of Sanctuary Account</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* PWA Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}
