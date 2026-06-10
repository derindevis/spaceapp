import { useEffect, useState } from "react";
import { Clock, Rocket, AlertTriangle, MapPin, Compass, Calendar, CheckCircle, XCircle } from "lucide-react";
import { getLaunches, getCachedLaunches, type LaunchItem } from "../api/space";

export function LaunchTrackerPage() {
  const cached = getCachedLaunches();
  const [upcoming, setUpcoming] = useState<LaunchItem[]>(cached?.upcoming || []);
  const [past, setPast] = useState<LaunchItem[]>(cached?.past || []);
  const [isLoading, setIsLoading] = useState(!cached);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");
  
  // Countdown state
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    async function loadLaunches() {
      if (!getCachedLaunches()) {
        setIsLoading(true);
      }
      setError("");
      try {
        const response = await getLaunches();
        setUpcoming(response.data.upcoming);
        setPast(response.data.past);
      } catch {
        if (!getCachedLaunches()) {
          setError("Unable to retrieve live launch manifest. Telemetry link down.");
        }
      } finally {
        setIsLoading(false);
      }
    }
    loadLaunches();
  }, []);

  // Countdown clock effect
  useEffect(() => {
    if (upcoming.length === 0) return;
    
    const nextLaunch = upcoming[0];
    const launchTime = new Date(nextLaunch.date).getTime();

    function updateClock() {
      const diff = launchTime - Date.now();
      if (diff <= 0) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      
      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const m = Math.floor((diff / 1000 / 60) % 60);
      const s = Math.floor((diff / 1000) % 60);
      
      setCountdown({ days: d, hours: h, minutes: m, seconds: s });
    }

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, [upcoming]);

  const activeList = activeTab === "upcoming" ? upcoming : past;
  const nextLaunch = upcoming[0];

  return (
    <section className="mx-auto max-w-6xl px-6 py-10">
      {/* Header */}
      <div className="border-b border-white/5 pb-6 mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-space-signal font-semibold font-mono">Rocket Telemetry</p>
          <h1 className="mt-2 text-3xl font-extrabold text-white">Live Space Launch Tracker</h1>
        </div>

        {/* Tab switchers */}
        <div className="inline-flex rounded-lg bg-white/5 p-1 border border-white/5 text-sm">
          <button
            className={`flex items-center gap-2 rounded-md px-4 py-2 transition ${activeTab === "upcoming" ? "bg-space-signal text-space-ink font-bold" : "text-slate-400 hover:text-white"}`}
            onClick={() => setActiveTab("upcoming")}
            type="button"
          >
            <Clock className="h-4 w-4" />
            Upcoming Manifest
          </button>
          <button
            className={`flex items-center gap-2 rounded-md px-4 py-2 transition ${activeTab === "past" ? "bg-space-signal text-space-ink font-bold" : "text-slate-400 hover:text-white"}`}
            onClick={() => setActiveTab("past")}
            type="button"
          >
            <Calendar className="h-4 w-4" />
            Launch Logs (Past)
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-500/50 bg-red-950/20 p-4 text-sm text-red-100">
          <AlertTriangle className="mt-0.5 h-4.5 w-4.5 shrink-0 text-red-400" aria-hidden="true" />
          <p>{error}</p>
        </div>
      )}

      {/* Main Countdown Section (Only on upcoming tab and if we have a next launch) */}
      {activeTab === "upcoming" && !isLoading && nextLaunch && (
        <article className="rounded-2xl border border-space-signal/20 bg-space-signal/5 p-8 backdrop-blur-md glow-border mb-8">
          <div className="grid gap-6 md:grid-cols-[1fr_auto]">
            <div className="space-y-4">
              <span className="inline-flex items-center gap-2 rounded-full border border-space-signal/30 bg-space-signal/10 px-3.5 py-1 text-[10px] font-bold tracking-wider text-space-signal font-mono uppercase animate-pulse">
                <Rocket className="h-3 w-3" /> Next Mission Countdown
              </span>
              <h2 className="text-2xl font-extrabold text-white">{nextLaunch.name}</h2>
              <p className="text-xs leading-5 text-slate-300 max-w-xl">{nextLaunch.description}</p>
              
              <div className="flex flex-wrap gap-4 text-xs font-mono font-bold text-slate-400">
                <span className="flex items-center gap-1.5"><Rocket className="h-4 w-4 text-space-amber" /> {nextLaunch.rocket}</span>
                <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-space-signal" /> {nextLaunch.location}</span>
              </div>
            </div>

            {/* Countdown Numbers Grid */}
            <div className="flex items-center gap-3 md:gap-5 self-center">
              {[
                { label: "Days", val: countdown.days },
                { label: "Hours", val: countdown.hours },
                { label: "Mins", val: countdown.minutes },
                { label: "Secs", val: countdown.seconds },
              ].map((clock, index) => (
                <div className="flex flex-col items-center bg-black/60 border border-white/5 rounded-xl p-3 w-16 md:w-20 shadow-lg" key={index}>
                  <span className="text-xl md:text-2xl font-extrabold text-space-amber font-mono tracking-tight leading-none">
                    {String(clock.val).padStart(2, "0")}
                  </span>
                  <span className="mt-2 text-[9px] uppercase tracking-wider text-slate-500 font-bold leading-none">{clock.label}</span>
                </div>
              ))}
            </div>
          </div>
        </article>
      )}

      {/* Grid List */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div className="h-[280px] w-full rounded-xl bg-white/5 animate-pulse border border-white/5" key={i} />
          ))
        ) : activeList.length === 0 ? (
          <div className="md:col-span-3 text-center p-16 border border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
            <Rocket className="h-12 w-12 text-slate-500 mb-4 mx-auto" />
            <h3 className="text-lg font-bold text-white">No Launches Found</h3>
          </div>
        ) : (
          activeList.map((launch) => (
            <article
              className="overflow-hidden rounded-xl border border-white/5 bg-white/[0.01] backdrop-blur-md glass-card-hover flex flex-col justify-between"
              key={launch.id}
            >
              <div>
                {/* Launch Image */}
                <div className="relative aspect-video bg-black/80 overflow-hidden border-b border-white/5">
                  {launch.image ? (
                    <img
                      alt={launch.name}
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-102"
                      loading="lazy"
                      src={launch.image}
                    />
                  ) : (
                    <div className="w-full h-full grid place-items-center">
                      <Rocket className="h-10 w-10 text-space-signal" />
                    </div>
                  )}
                  {/* Provider tag overlay */}
                  <span className="absolute top-3 left-3 text-[9px] font-mono font-bold bg-black/70 border border-white/10 text-space-frost px-2 py-1 rounded">
                    {launch.provider}
                  </span>
                  {/* Status indicator */}
                  <span className={[
                    "absolute top-3 right-3 text-[9px] font-bold px-2 py-1 rounded flex items-center gap-1",
                    launch.status_code === "Success" || launch.status_code === "Go"
                      ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-400"
                      : "bg-red-500/20 border border-red-500/30 text-red-400",
                  ].join(" ")}>
                    {launch.status_code === "Success" ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                    {launch.status_code}
                  </span>
                </div>

                {/* Info */}
                <div className="p-5 space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-white line-clamp-1 leading-snug">{launch.name}</h3>
                    <p className="mt-1 text-[10px] font-mono font-bold text-space-amber">
                      {new Date(launch.date).toLocaleString()}
                    </p>
                  </div>
                  <p className="text-xs leading-5 text-slate-400 line-clamp-3 font-normal">{launch.description}</p>
                </div>
              </div>

              {/* Pad details */}
              <div className="px-5 pb-5 pt-3 border-t border-white/5 flex flex-col gap-2 bg-white/[0.005]">
                <div className="flex items-center gap-1.5 text-[10px] text-slate-300 font-mono font-medium">
                  <MapPin className="h-3.5 w-3.5 text-space-signal shrink-0" />
                  <span className="truncate">{launch.location}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-300 font-mono font-medium">
                  <Compass className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                  <span className="truncate">Orbit: {launch.orbit}</span>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
