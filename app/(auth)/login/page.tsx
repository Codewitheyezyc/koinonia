"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";
import SplashScreen from "@/components/SplashScreen";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isMagicLink, setIsMagicLink] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSplash, setShowSplash] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  const router = useRouter();
  const supabase = createClient();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (isMagicLink) {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (error) throw error;
        setMessage({ type: "success", text: "Check your email for the magic sign-in link!" });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;

        // Show animated splash screen before loading dashboard
        setShowSplash(true);
        setTimeout(() => {
          router.push("/dashboard");
          router.refresh();
        }, 2000);
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Authentication failed" });
      setShowSplash(false);
    } finally {
      setLoading(false);
    }
  };

  if (showSplash) {
    return <SplashScreen message="Entering Fellowship Sanctuary..." />;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <div className="w-full max-w-md space-y-8 bg-slate-900/80 p-8 rounded-2xl border border-slate-800 backdrop-blur-md shadow-2xl">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-block group">
            <h1 className="font-serif text-3xl font-bold tracking-[0.2em] text-slate-50 uppercase">
              KOINONIA<span className="text-amber-500 font-extrabold">.</span>
            </h1>
          </Link>
          <p className="text-xs text-slate-400 font-light leading-relaxed">
            Step into a quiet, sacred space dedicated to prayer, scripture, and authentic fellowship.
          </p>
        </div>

        {/* Status Messages */}
        {message && (
          <div
            className={`p-3.5 rounded-lg text-xs font-medium border ${
              message.type === "error"
                ? "bg-rose-950/40 border-rose-800/60 text-rose-300"
                : "bg-emerald-950/40 border-emerald-800/60 text-emerald-300"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Auth Mode Toggle */}
        <div className="flex rounded-lg bg-slate-950/60 p-1 border border-slate-800 text-xs font-medium">
          <button
            type="button"
            onClick={() => setIsMagicLink(false)}
            className={`flex-1 py-2 rounded-md transition-all cursor-pointer ${
              !isMagicLink ? "bg-amber-600 text-white shadow-sm font-semibold" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Password Sign In
          </button>
          <button
            type="button"
            onClick={() => setIsMagicLink(true)}
            className={`flex-1 py-2 rounded-md transition-all cursor-pointer ${
              isMagicLink ? "bg-amber-600 text-white shadow-sm font-semibold" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Magic Link
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.name@example.com"
                className="w-full bg-slate-950/80 border border-slate-800 rounded-lg pl-9 pr-3 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/80 transition"
              />
            </div>
          </div>

          {!isMagicLink && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-lg pl-9 pr-10 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/80 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition cursor-pointer"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-semibold text-sm shadow-lg shadow-amber-950/30 transition disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                {isMagicLink ? "Send Magic Link" : "Sign In to Fellowship"}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-slate-800/80">
          <p className="text-xs text-slate-400">
            Don&apos;t have an account yet?{" "}
            <Link href="/signup" className="text-amber-400 hover:underline font-medium">
              Join Koinonia
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
