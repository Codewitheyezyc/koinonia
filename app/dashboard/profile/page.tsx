"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import DashboardNavbar from "@/components/DashboardNavbar";
import MobileBottomNav from "@/components/MobileBottomNav";
import { User, BookOpen, Shield, Check, Loader2, Heart, Award } from "lucide-react";

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [favoriteScripture, setFavoriteScripture] = useState("");
  const [preferredTranslation, setPreferredTranslation] = useState("KJV");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setUser(user);

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profile) {
        setFullName(profile.full_name || "");
        setBio(profile.bio || "Fellow believer walking in faith.");
        setFavoriteScripture(profile.favorite_scripture || "John 3:16");
        setPreferredTranslation(profile.preferred_translation || "KJV");
      } else {
        setFullName(user.email?.split("@")[0] || "");
      }
      setLoading(false);
    }

    loadProfile();
  }, [router, supabase]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || saving) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          full_name: fullName.trim(),
          bio: bio.trim(),
          favorite_scripture: favoriteScripture.trim(),
          preferred_translation: preferredTranslation,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) {
      console.error("Failed to save profile:", err);
    } finally {
      setSaving(false);
    }
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
      {/* Integrated Header */}
      <DashboardNavbar fellowshipName="Believer Profile" channelName="profile" />

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 pb-28 md:pb-8">
        <div className="max-w-xl mx-auto space-y-6">
          {/* Avatar Banner */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-4 shadow-xl">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 text-slate-950 flex items-center justify-center font-extrabold text-2xl shadow-lg shadow-amber-950/40">
              {fullName?.charAt(0).toUpperCase() || "B"}
            </div>
            <div className="space-y-1 truncate">
              <h2 className="font-serif text-xl font-bold text-slate-100 truncate">
                {fullName || "Believer"}
              </h2>
              <p className="text-xs text-slate-400 font-mono truncate">{user?.email}</p>
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-semibold">
                <Shield className="w-3 h-3" /> Verified Member
              </div>
            </div>
          </div>

          {/* Profile Form */}
          <form onSubmit={handleSave} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5 shadow-xl">
            <h3 className="font-serif text-base font-bold text-slate-200 flex items-center gap-2 border-b border-slate-800/80 pb-3">
              <User className="w-4 h-4 text-amber-500" /> Profile Details
            </h3>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">Full Name / Display Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Isaac Peter"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">Personal Testimony / Bio</label>
              <textarea
                rows={2}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Share a short note about your faith journey..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-rose-400" /> Favorite Scripture
                </label>
                <input
                  type="text"
                  value={favoriteScripture}
                  onChange={(e) => setFavoriteScripture(e.target.value)}
                  placeholder="e.g. Psalm 23:1"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-emerald-400" /> Bible Translation
                </label>
                <select
                  value={preferredTranslation}
                  onChange={(e) => setPreferredTranslation(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-amber-500 transition"
                >
                  <option value="KJV">King James Version (KJV)</option>
                  <option value="WEB">World English Bible (WEB)</option>
                  <option value="BBE">Bible in Basic English (BBE)</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold text-xs transition shadow-lg shadow-amber-950/30 cursor-pointer disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : saved ? (
                <Check className="w-4 h-4" />
              ) : null}
              <span>{saved ? "Profile Updated Successfully" : "Save Profile Changes"}</span>
            </button>
          </form>
        </div>
      </div>

      {/* PWA Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}
