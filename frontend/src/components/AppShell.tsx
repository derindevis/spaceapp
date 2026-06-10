import { LogOut, Radar } from "lucide-react";
import { Link, NavLink, Outlet } from "react-router-dom";

import { useAuth } from "../auth/useAuth";

const navItems = [
  { label: "Dashboard", to: "/dashboard" },
  { label: "Asteroids", to: "/asteroids" },
  { label: "Weather", to: "/space-weather" },
  { label: "Mars", to: "/mars-explorer" },
  { label: "Explore", to: "/explore" },
  { label: "Academy", to: "/academy" },
  { label: "Library", to: "/library" },
  { label: "Launches", to: "/launches" },
];

export function AppShell() {
  const { logout, user } = useAuth();

  return (
    <main className="min-h-screen cosmic-bg text-space-frost pb-12">
      <header className="border-b border-white/5 bg-black/20 backdrop-blur-md sticky top-0 z-50">
        <div className="mx-auto flex min-h-[72px] max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-3">
          <Link className="flex items-center gap-3" to="/dashboard">
            <span className="grid h-10 w-10 place-items-center rounded-md border border-white/10 bg-white/5">
              <Radar className="h-5 w-5 text-space-signal animate-pulse" aria-hidden="true" />
            </span>
            <span>
              <span className="block text-xs uppercase tracking-wider text-space-signal font-semibold">Space Intelligence</span>
              <span className="block text-lg font-bold tracking-tight">Mission Dashboard</span>
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-slate-300 sm:inline bg-white/5 border border-white/5 px-3 py-1.5 rounded-full font-medium">{user?.email}</span>
            <button
              className="inline-flex h-10 items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 text-sm text-space-frost transition hover:border-space-signal/50 hover:bg-space-signal/10 hover:text-white"
              onClick={logout}
              type="button"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Sign out
            </button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-6 pb-3">
          {navItems.map((item) => (
            <NavLink
              className={({ isActive }) =>
                [
                  "rounded-md px-4 py-2 text-sm font-semibold transition border",
                  isActive
                    ? "border-space-signal/30 bg-space-signal/20 text-space-signal neon-glow-cyan"
                    : "border-transparent text-slate-400 hover:border-white/10 hover:bg-white/5 hover:text-white",
                ].join(" ")
              }
              key={item.to}
              to={item.to}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <Outlet />
    </main>
  );
}
