"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Users, Shield, ArrowRight, Loader2, CheckCircle2,
  UserCheck, Sparkles, Mail, ChevronLeft, ExternalLink,
} from "lucide-react";

type Step = "landing" | "quick-join-form" | "magic-link-sent" | "joining";

export default function JoinFellowshipPage({
  params,
}: {
  params: Promise<{ inviteCode: string }>;
}) {
  const { inviteCode } = use(params);
  const [fellowship, setFellowship] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [alreadyMember, setAlreadyMember] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Quick-join form state
  const [step, setStep] = useState<Step>("landing");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        setUser(currentUser);

        const { data, error: fellowshipError } = await supabase
          .from("fellowships")
          .select("*, profiles:created_by(full_name)")
          .eq("invite_code", inviteCode)
          .single();

        if (fellowshipError || !data) {
          setError("Fellowship invite link is invalid or has expired.");
          return;
        }
        setFellowship(data);

        if (currentUser) {
          const { data: memberData } = await supabase
            .from("fellowship_members")
            .select("id")
            .eq("fellowship_id", data.id)
            .eq("user_id", currentUser.id)
            .maybeSingle();

          if (memberData) {
            // Already a member — redirect straight to dashboard
            router.replace(`/dashboard/fellowship/${data.id}`);
            return;
          } else {
            // Auto-join when arriving authenticated (e.g., after magic link click)
            setStep("joining");
            await supabase
              .from("fellowship_members")
              .insert({ fellowship_id: data.id, user_id: currentUser.id, role: "member" })
              .select();
            router.replace(`/dashboard/fellowship/${data.id}`);
            return;
          }
        }
      } catch (err: any) {
        setError(err.message || "Failed to load invitation.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [inviteCode, supabase]);

  // Logged-in user: join directly
  const handleJoinAuthenticated = async () => {
    if (!user) {
      router.push(`/login?next=/join/${inviteCode}`);
      return;
    }
    setStep("joining");
    try {
      if (!alreadyMember) {
        const { error: joinError } = await supabase
          .from("fellowship_members")
          .insert({ fellowship_id: fellowship.id, user_id: user.id, role: "member" });
        if (joinError && !joinError.message.includes("unique constraint")) throw joinError;
      }
      router.push(`/dashboard/fellowship/${fellowship.id}`);
    } catch (err: any) {
      setError(err.message || "Failed to join fellowship.");
      setStep("landing");
    }
  };

  // Guest quick-join via Magic Link (no password required)
  const handleSendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim() || !email.trim() || submitting) return;
    setFormError(null);
    setSubmitting(true);

    try {
      // Store their intended name in localStorage — picked up after magic link lands
      localStorage.setItem(
        `koinonia_join_${inviteCode}`,
        JSON.stringify({ displayName: displayName.trim(), fellowshipId: fellowship.id })
      );

      // Send OTP magic link — redirects to /auth/callback?next=/join/INVITE_CODE
      const { error: otpErr } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/join/${inviteCode}&name=${encodeURIComponent(displayName.trim())}`,
          data: {
            full_name: displayName.trim(),
          },
        },
      });

      if (otpErr) throw otpErr;
      setStep("magic-link-sent");
    } catch (err: any) {
      setFormError(err.message || "Failed to send magic link. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Loading ──
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  // ── Error ──
  if (error || !fellowship) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-slate-950 text-slate-100">
        <div className="max-w-md w-full p-8 bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-4 shadow-2xl">
          <div className="w-14 h-14 mx-auto rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center">
            <Shield className="w-7 h-7 text-rose-400" />
          </div>
          <h2 className="font-serif text-2xl font-bold text-rose-400">Invite Not Found</h2>
          <p className="text-sm text-slate-400">{error || "This invitation link is no longer active."}</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 text-slate-200 text-sm hover:bg-slate-700 transition"
          >
            Go to Homepage
          </Link>
        </div>
      </div>
    );
  }

  // ── Joining spinner ──
  if (step === "joining") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
        <p className="text-sm text-slate-400">Entering {fellowship.name}…</p>
      </div>
    );
  }

  // ── Magic Link Sent ──
  if (step === "magic-link-sent") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100">
        <div className="w-full max-w-md space-y-5 bg-slate-900/90 p-6 sm:p-8 rounded-2xl border border-slate-800 backdrop-blur-md shadow-2xl text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
            <Mail className="w-8 h-8 text-emerald-400" />
          </div>
          <div className="space-y-2">
            <h2 className="font-serif text-2xl font-bold text-slate-50">Check Your Email</h2>
            <p className="text-sm text-slate-400">
              We sent a magic link to <span className="text-amber-400 font-semibold">{email}</span>.
              Click the link in your email to enter <span className="text-slate-200 font-semibold">{fellowship.name}</span>.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-700/50 text-xs text-slate-400 text-left space-y-1.5">
            <p className="font-semibold text-slate-300">📧 What to expect:</p>
            <p>• Open the email from <span className="text-slate-300">Koinonia</span></p>
            <p>• Click the <span className="text-amber-400 font-medium">"Join Fellowship"</span> button</p>
            <p>• You'll be taken directly into the fellowship — no password needed</p>
          </div>
          <button
            onClick={() => setStep("quick-join-form")}
            className="text-xs text-slate-500 hover:text-slate-300 transition cursor-pointer underline"
          >
            Use a different email
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <div className="w-full max-w-lg space-y-5 bg-slate-900/90 p-6 sm:p-8 rounded-2xl border border-slate-800 backdrop-blur-md shadow-2xl">

        {/* Fellowship Header */}
        <div className="text-center space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-semibold uppercase tracking-wider">
            ✉️ Fellowship Invitation
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-slate-50">{fellowship.name}</h1>
          <p className="text-xs text-slate-400">
            Hosted by{" "}
            <span className="text-slate-200 font-medium">
              {fellowship.profiles?.full_name || "a Believer"}
            </span>
          </p>
        </div>

        {fellowship.description && (
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs sm:text-sm text-slate-300 italic text-center">
            &ldquo;{fellowship.description}&rdquo;
          </div>
        )}

        <div className="space-y-2">
          {[
            { icon: Users, color: "text-emerald-400", text: "Access shared prayer rooms, study notes, and prayer boards." },
            { icon: Shield, color: "text-amber-400", text: "Private community protected. Only invite link holders can join." },
          ].map(({ icon: Icon, color, text }) => (
            <div key={text} className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/40 border border-slate-800 text-xs text-slate-300">
              <Icon className={`w-4 h-4 ${color} shrink-0 mt-0.5`} />
              <span>{text}</span>
            </div>
          ))}
        </div>

        {/* ── Join Actions ── */}
        <div className="pt-1 space-y-3">

          {/* Logged-in user */}
          {user ? (
            <button
              onClick={handleJoinAuthenticated}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold text-sm shadow-xl shadow-amber-950/40 transition cursor-pointer"
            >
              {alreadyMember ? (
                <><UserCheck className="w-5 h-5" /><span>You're a Member — Open Fellowship</span></>
              ) : (
                <><CheckCircle2 className="w-5 h-5" /><span>Join Fellowship Now</span></>
              )}
            </button>
          ) : step === "quick-join-form" ? (
            /* ── Quick-join form (name + email + magic link) ── */
            <form onSubmit={handleSendMagicLink} className="space-y-3 p-4 rounded-xl bg-slate-950 border border-slate-700">
              <div className="flex items-center gap-2 mb-1">
                <button
                  type="button"
                  onClick={() => { setStep("landing"); setFormError(null); }}
                  className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <p className="text-xs font-semibold text-slate-300">Quick Join — No Password Needed</p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-400">Your Name</label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Sister Grace"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-400">Your Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. grace@example.com"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
                />
                <p className="text-[10px] text-slate-500">
                  We'll send a one-click magic link. No password required.
                </p>
              </div>

              {formError && (
                <p className="text-[11px] text-rose-400 bg-rose-950/30 border border-rose-800/40 rounded-lg p-2">{formError}</p>
              )}

              <button
                type="submit"
                disabled={submitting || !displayName.trim() || !email.trim()}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs transition cursor-pointer disabled:opacity-50"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                <span>Send Magic Link to Join</span>
              </button>
            </form>
          ) : (
            /* ── Landing: two options ── */
            <>
              {/* Quick join (magic link) */}
              <button
                onClick={() => setStep("quick-join-form")}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-emerald-600/15 hover:bg-emerald-600/25 border border-emerald-500/30 text-emerald-300 font-bold text-sm transition cursor-pointer group"
              >
                <Sparkles className="w-5 h-5 text-emerald-400 group-hover:animate-pulse" />
                <span>Join with Magic Link — No Password</span>
              </button>
              <p className="text-center text-[10px] text-slate-500">
                Enter your name + email, receive a one-click link — you're in instantly.
              </p>

              <div className="flex items-center gap-2">
                <div className="flex-1 h-px bg-slate-800" />
                <span className="text-[10px] text-slate-500 uppercase tracking-wider">or</span>
                <div className="flex-1 h-px bg-slate-800" />
              </div>

              {/* Full sign-in / signup */}
              <button
                onClick={() => router.push(`/login?next=/join/${inviteCode}`)}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold text-sm transition cursor-pointer shadow-lg shadow-amber-950/30"
              >
                <span>Sign In or Create Full Account</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

        <p className="text-center text-[10px] text-slate-600">
          By joining you agree to participate respectfully in this faith community.
        </p>
      </div>
    </div>
  );
}
