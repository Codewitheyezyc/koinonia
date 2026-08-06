import Link from "next/link";
import {
  Sparkles,
  ShieldCheck,
  Heart,
  Users,
  Video,
  BookOpen,
  ArrowRight,
  Download,
  Flame,
  CheckCircle2,
  Smartphone,
  MessageCircle,
  Clock,
  HelpCircle,
  ChevronRight,
  Lock,
  Globe,
  Share2,
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-600/30 selection:text-amber-200">
      {/* Top Navigation */}
      <header className="h-20 px-6 sm:px-12 border-b border-slate-800/60 flex items-center justify-between max-w-7xl w-full mx-auto sticky top-0 bg-slate-950/80 backdrop-blur-md z-40">
        <Link href="/" className="flex items-center gap-2 group">
          <h1 className="font-serif text-2xl font-bold tracking-[0.2em] text-slate-50 uppercase">
            KOINONIA<span className="text-amber-500 font-extrabold">.</span>
          </h1>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-300">
          <a href="#why-koinonia" className="hover:text-amber-400 transition">
            Why Koinonia
          </a>
          <a href="#how-it-works" className="hover:text-amber-400 transition">
            How It Works
          </a>
          <a href="#features" className="hover:text-amber-400 transition">
            Features
          </a>
          <a href="#faq" className="hover:text-amber-400 transition">
            FAQ
          </a>
        </nav>

        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-xs font-semibold text-slate-300 hover:text-amber-400 transition"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-semibold text-xs shadow-lg shadow-amber-950/30 transition cursor-pointer"
          >
            Gather Now
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20 max-w-5xl mx-auto space-y-8 relative overflow-hidden">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          The Digital Christian Sanctuary
        </div>

        <h1 className="font-serif text-4xl sm:text-7xl font-bold tracking-tight text-slate-50 leading-[1.1] max-w-4xl">
          Gathering believers in <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600">Prayer, Scripture & Fellowship</span>
        </h1>

        <p className="text-base sm:text-xl text-slate-300 font-light max-w-2xl leading-relaxed">
          Koinonia replaces noisy social channels and corporate meeting tools with a quiet, peaceful space built specifically for prayer groups, family devotions, and Bible studies.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 pt-4 w-full sm:w-auto">
          <Link
            href="/signup"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold text-sm shadow-xl shadow-amber-950/40 transition cursor-pointer"
          >
            Create Your Fellowship Space
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 hover:text-amber-400 hover:border-amber-500/40 font-semibold text-sm transition"
          >
            <Smartphone className="w-4 h-4 text-amber-500" />
            Add to Phone / Desktop
          </Link>
        </div>

        {/* Badges */}
        <div className="pt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-medium text-slate-400 border-t border-slate-800/80 w-full max-w-3xl">
          <div className="flex items-center justify-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-amber-500" /> No Ads or Likes
          </div>
          <div className="flex items-center justify-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-amber-500" /> 100% Private & Safe
          </div>
          <div className="flex items-center justify-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-amber-500" /> Clear Voice & Video
          </div>
          <div className="flex items-center justify-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-amber-500" /> 1-Click Instant Invites
          </div>
        </div>
      </section>

      {/* WHY KOINONIA SECTION */}
      <section id="why-koinonia" className="py-20 px-6 sm:px-12 bg-slate-900/60 border-t border-slate-800/60">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-widest">
              The Koinonia Sanctuary Way
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-slate-100">
              Technology Built Purposefully for Fellowship
            </h2>
            <p className="text-sm text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Believers were created to gather, encourage one another, and pray together. Koinonia provides a quiet, reverent space designed from the ground up for Christian community.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-8 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
                ✓
              </div>
              <h3 className="font-serif text-base font-bold text-slate-100">Uninterrupted Gathering</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Gather freely for morning devotions, midnight prayer watches, or Bible studies without call time limits or abrupt cutoffs.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
                ✓
              </div>
              <h3 className="font-serif text-base font-bold text-slate-100">Active Intercession</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Post prayer needs and know your group is supporting you. Members tap <em>&quot;I Prayed for This&quot;</em> to give real-time encouragement.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
                ✓
              </div>
              <h3 className="font-serif text-base font-bold text-slate-100">100% Private & Sacred</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Your prayer requests and fellowship discussions are sacred data. They stay strictly private inside your group—never sold, indexed, or shown ads.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section id="how-it-works" className="py-20 px-6 sm:px-12 bg-slate-950 border-t border-slate-800/60">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-widest">
              Simple 3-Step Setup
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-slate-100">
              How Koinonia Works
            </h2>
            <p className="text-sm text-slate-400 max-w-xl mx-auto">
              Gathering your church small group, family devotion, or prayer circle takes less than 1 minute.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4 text-center">
              <div className="w-12 h-12 rounded-full bg-amber-600 text-slate-950 font-serif font-bold text-lg flex items-center justify-center mx-auto shadow-lg shadow-amber-950/30">
                1
              </div>
              <h3 className="font-serif text-lg font-bold text-slate-100">Create a Fellowship</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Give your group a name (e.g. <em>Morning Intercession</em> or <em>Family Bible Study</em>). Your space is created instantly.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4 text-center">
              <div className="w-12 h-12 rounded-full bg-amber-600 text-slate-950 font-serif font-bold text-lg flex items-center justify-center mx-auto shadow-lg shadow-amber-950/30">
                2
              </div>
              <h3 className="font-serif text-lg font-bold text-slate-100">Share Your Invite Link</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Send your unique invite link directly on WhatsApp or SMS. Members tap once to join without confusing app store setups.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4 text-center">
              <div className="w-12 h-12 rounded-full bg-amber-600 text-slate-950 font-serif font-bold text-lg flex items-center justify-center mx-auto shadow-lg shadow-amber-950/30">
                3
              </div>
              <h3 className="font-serif text-lg font-bold text-slate-100">Pray & Study Together</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Tap <strong>Gather & Pray</strong> for crystal-clear voice calls, track answered prayers, and pin Bible study notes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURE PILLARS SECTION */}
      <section id="features" className="py-20 px-6 sm:px-12 bg-slate-900/40 border-t border-slate-800/60">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-slate-100">
              Features Built for Believers
            </h2>
            <p className="text-xs text-slate-400 max-w-xl mx-auto">
              Every tool is simple, intuitive, and designed to foster authentic spiritual fellowship.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 hover:border-amber-500/40 transition shadow-lg">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                <Video className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-lg font-bold text-slate-100">Live Voice & Video Prayer</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Clear prayer rooms with faith-based worship reactions (Amen, Praying Hands) and high-definition screen sharing for Bible studies.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 hover:border-rose-500/40 transition shadow-lg">
              <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
                <Heart className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-lg font-bold text-slate-100">Interactive Prayer Board</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Post prayer requests and track answers. Tapping &quot;I Prayed for This&quot; notifies authors in real time, transforming prayer into shared action.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 hover:border-emerald-500/40 transition shadow-lg">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-lg font-bold text-slate-100">Scripture & Study Notes</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Dedicated spaces to share Bible passages, sermon outlines, and study notes so your fellowship stays connected all week long.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section id="faq" className="py-20 px-6 sm:px-12 bg-slate-950 border-t border-slate-800/60">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-widest">
              Got Questions?
            </span>
            <h2 className="font-serif text-3xl font-bold text-slate-100">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4">
            <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
              <h3 className="font-serif text-base font-semibold text-slate-100 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-amber-500 shrink-0" />
                Is Koinonia free to use?
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed pl-6">
                Yes! Koinonia is free for everyday believers, family devotions, and small prayer groups. You get unlimited prayer request tracking, scripture notes, and live voice/video calls for up to 15 concurrent participants per meeting.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
              <h3 className="font-serif text-base font-semibold text-slate-100 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-amber-500 shrink-0" />
                Are my prayer requests private and safe?
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed pl-6">
                Absolutly. Every fellowship group is strictly private and secured under database Row-Level Security. Only members who have joined your group can view your prayer requests. Data is never sold, indexed on search engines, or mined for ads.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
              <h3 className="font-serif text-base font-semibold text-slate-100 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-amber-500 shrink-0" />
                Do my group members need to download a heavy app?
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed pl-6">
                No! Koinonia works progressive-first in any web browser on iPhone, Android, tablet, or desktop. Members can join in 1 tap from an invite link, or save it directly to their phone&apos;s home screen.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
              <h3 className="font-serif text-base font-semibold text-slate-100 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-amber-500 shrink-0" />
                Can older or non-tech-savvy members use Koinonia easily?
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed pl-6">
                Yes. We designed the interface to be clean, calm, and zero-friction. Joining a prayer meeting or checking the Prayer Request Board takes just 1 or 2 taps without confusing technical settings.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* RICH EXPANDED FOOTER */}
      <footer className="py-16 px-6 sm:px-12 bg-slate-950 border-t border-slate-800/80 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-slate-800/80">
          {/* Column 1: Brand & Mission */}
          <div className="space-y-4">
            <Link href="/" className="inline-block">
              <h2 className="font-serif text-2xl font-bold tracking-[0.2em] text-slate-50 uppercase">
                KOINONIA<span className="text-amber-500 font-extrabold">.</span>
              </h2>
            </Link>
            <p className="text-xs text-slate-400 leading-relaxed">
              A dedicated, sacred digital sanctuary for Christian gathering, real-time prayer rooms, and authentic intercession worldwide.
            </p>
            <div className="text-[11px] text-amber-400/90 font-medium">
              ✝ Dedicated to the Global Body of Christ
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="space-y-3">
            <h4 className="font-serif font-bold text-slate-200 uppercase tracking-wider text-xs">
              Quick Navigation
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="#why-koinonia" className="hover:text-amber-400 transition">
                  Why Koinonia
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-amber-400 transition">
                  How It Works
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-amber-400 transition">
                  Platform Features
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-amber-400 transition">
                  Frequently Asked Questions
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Platform Features */}
          <div className="space-y-3">
            <h4 className="font-serif font-bold text-slate-200 uppercase tracking-wider text-xs">
              Fellowship Features
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li className="flex items-center gap-1.5">
                <Video className="w-3.5 h-3.5 text-amber-500" /> Audio/Video Prayer Rooms
              </li>
              <li className="flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-rose-500" /> Prayer Request Board
              </li>
              <li className="flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-emerald-500" /> Scripture Study Notes
              </li>
              <li className="flex items-center gap-1.5">
                <Share2 className="w-3.5 h-3.5 text-amber-500" /> 1-Click Shareable Invites
              </li>
            </ul>
          </div>

          {/* Column 4: Privacy & Account */}
          <div className="space-y-3">
            <h4 className="font-serif font-bold text-slate-200 uppercase tracking-wider text-xs">
              Account & Privacy
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/login" className="hover:text-amber-400 transition">
                  Sign In to Account
                </Link>
              </li>
              <li>
                <Link href="/signup" className="hover:text-amber-400 transition">
                  Create New Fellowship
                </Link>
              </li>
              <li className="flex items-center gap-1.5 text-emerald-400 pt-1">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>100% Protected Data & Privacy</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Legal Bar */}
        <div className="max-w-7xl mx-auto pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <p>© {new Date().getFullYear()} Koinonia Digital Sanctuary. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="hover:text-slate-400 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-slate-400 cursor-pointer">Terms of Service</span>
            <span className="hover:text-slate-400 cursor-pointer">Kingdom Ethics</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
