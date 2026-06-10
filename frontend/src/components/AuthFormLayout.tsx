import { Radar } from "lucide-react";
import { Link } from "react-router-dom";
import type { ReactNode } from "react";

type AuthFormLayoutProps = {
  children: ReactNode;
  footer: ReactNode;
  subtitle: string;
  title: string;
};

export function AuthFormLayout({ children, footer, subtitle, title }: AuthFormLayoutProps) {
  return (
    <main className="grid min-h-screen bg-space-ink text-space-frost lg:grid-cols-[1fr_1fr]">
      {/* Visual Left Panel with space background */}
      <section 
        className="relative flex min-h-[360px] flex-col justify-between px-8 py-10 border-b border-white/5 lg:border-b-0 lg:border-r bg-cover bg-center overflow-hidden"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=1000')",
        }}
      >
        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-space-ink via-space-ink/70 to-space-ink/80 z-0 pointer-events-none" />

        {/* Branding header */}
        <div className="relative z-10">
          <Link className="inline-flex items-center gap-3" to="/">
            <span className="grid h-10 w-10 place-items-center rounded-xl border border-space-signal/30 bg-space-signal/15 backdrop-blur-md">
              <Radar className="h-5 w-5 text-space-signal animate-pulse" aria-hidden="true" />
            </span>
            <span>
              <span className="block text-[10px] tracking-widest uppercase text-space-signal font-mono font-semibold">Space Intelligence</span>
              <span className="block text-lg font-bold text-white">Observability Hub</span>
            </span>
          </Link>
        </div>

        {/* Title / Description */}
        <div className="relative z-10 max-w-md mt-auto">
          <h1 className="text-4xl font-extrabold leading-tight text-white tracking-tight">
            Discover the cosmos with real-time telemetry.
          </h1>
          <p className="mt-4 text-sm leading-6 text-slate-200">
            Sign in to access protected dashboards, live satellite orbits, astronomy media archives, space weather charts, and direct high-resolution downloads.
          </p>
        </div>
      </section>

      {/* Form Right Panel */}
      <section className="flex items-center justify-center px-6 py-12 bg-space-ink relative">
        {/* Subtle glow sphere behind the card */}
        <div className="absolute w-[320px] h-[320px] rounded-full bg-space-signal/5 blur-[80px] pointer-events-none" />
        
        <div className="w-full max-w-md rounded-2xl border border-white/5 glass-card p-8 relative z-10">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white">{title}</h2>
            <p className="mt-2 text-xs leading-5 text-slate-400">{subtitle}</p>
          </div>
          <div className="mt-6">
            {children}
          </div>
          <div className="mt-6 border-t border-white/5 pt-5 text-xs text-slate-400">
            {footer}
          </div>
        </div>
      </section>
    </main>
  );
}
