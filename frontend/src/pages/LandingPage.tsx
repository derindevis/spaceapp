import { ArrowRight, LogIn, Radar, Globe, Activity, Compass, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

import { useAuth } from "../auth/useAuth";

export function LandingPage() {
  const { isAuthenticated } = useAuth();

  return (
    <main className="relative min-h-screen bg-space-ink text-space-frost overflow-x-hidden">
      {/* Background Graphic Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none opacity-25"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1920')",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-space-ink via-space-ink/90 to-space-ink pointer-events-none" />

      {/* Main Container */}
      <div className="relative z-10">
        <header className="border-b border-white/5 bg-black/40 backdrop-blur-md sticky top-0 z-50">
          <div className="mx-auto flex min-h-[76px] max-w-6xl items-center justify-between gap-4 px-6">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl border border-space-signal/20 bg-space-signal/5">
                <Radar className="h-5 w-5 text-space-signal animate-pulse" aria-hidden="true" />
              </span>
              <div>
                <p className="text-[10px] tracking-widest uppercase text-space-signal font-mono font-semibold">Space Intelligence</p>
                <h1 className="text-lg font-bold tracking-tight text-white">Observability Hub</h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 text-xs font-semibold tracking-wide transition hover:border-space-signal hover:bg-white/10"
                to="/login"
              >
                <LogIn className="h-3.5 w-3.5" aria-hidden="true" />
                Login
              </Link>
              <Link
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-space-signal px-4 text-xs font-extrabold tracking-wide text-space-ink transition hover:bg-cyan-300 shadow-[0_0_15px_rgba(57,192,212,0.3)]"
                to={isAuthenticated ? "/dashboard" : "/register"}
              >
                {isAuthenticated ? "Enter Command Center" : "Launch Platform"}
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="mx-auto max-w-6xl px-6 py-20 text-center flex flex-col items-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-space-signal/20 bg-space-signal/10 px-4 py-1.5 text-xs font-semibold tracking-wide text-space-signal font-mono uppercase animate-pulse">
            <Sparkles className="h-3.5 w-3.5 text-space-amber" />
            Phase 2 Explorer Live
          </span>
          <h2 className="mt-6 max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl bg-gradient-to-b from-white via-space-frost to-slate-400 bg-clip-text text-transparent">
            Study, track, and explore space in real-time.
          </h2>
          <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300">
            A state-of-the-art visual command center combining live satellite tracking, high-definition space galleries, alerts monitoring, and Gemini AI analysis.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              className="inline-flex h-12 items-center gap-2 rounded-lg bg-space-signal px-6 text-sm font-extrabold tracking-wide text-space-ink transition hover:bg-cyan-300 shadow-[0_0_20px_rgba(57,192,212,0.4)]"
              to={isAuthenticated ? "/dashboard" : "/register"}
            >
              Start Exploring Free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              className="inline-flex h-12 items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-6 text-sm font-semibold tracking-wide transition hover:border-space-signal hover:bg-white/10"
              to="/login"
            >
              Sign In
            </Link>
          </div>
        </section>

        {/* Features Showcase */}
        <section className="mx-auto max-w-6xl px-6 pb-24">
          <div className="border-t border-white/5 pt-16">
            <h3 className="text-center text-xs font-semibold tracking-widest text-space-signal uppercase font-mono">
              Core Platform Capabilities
            </h3>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  title: "Earth Observatory",
                  desc: "Access natural color Earth images captured 1 million miles away by NASA's DSCOVR satellite.",
                  icon: Globe,
                  border: "border-cyan-500/10",
                },
                {
                  title: "ISS Tracking & Crew",
                  desc: "Track the live orbital position of the ISS and explore active crew member directories.",
                  icon: Compass,
                  border: "border-purple-500/10",
                },
                {
                  title: "Space Weather Feeds",
                  desc: "Stay informed on solar flares, geomagnetic storms, and CME reports via DONKI alerts.",
                  icon: Activity,
                  border: "border-red-500/10",
                },
                {
                  title: "AI Analysis Hub",
                  desc: "Read simplified layman summaries and threat analyses powered by Gemini AI models.",
                  icon: Sparkles,
                  border: "border-amber-500/10",
                },
              ].map((feat, idx) => {
                const Icon = feat.icon;
                return (
                  <div
                    className={`rounded-2xl border ${feat.border} bg-white/[0.02] p-6 backdrop-blur-md transition duration-300 hover:bg-white/[0.04] hover:-translate-y-1`}
                    key={idx}
                  >
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-space-signal">
                      <Icon className="h-5 w-5" />
                    </span>
                    <h4 className="mt-4 text-base font-bold text-white">{feat.title}</h4>
                    <p className="mt-2 text-xs leading-5 text-slate-400">{feat.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
