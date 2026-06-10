import { useEffect, useState } from "react";
import { Activity, AlertTriangle, Bell, Image, Orbit, Rocket, Sparkles, X } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

import {
  getApodToday,
  getCachedApod,
  getAsteroidStats,
  getCachedAsteroidStats,
  getMarsPhotos,
  getCachedMarsPhotos,
  getSolarFlares,
  getCachedSolarFlares,
  getWeatherAlerts,
  type ApodEntry,
  type AsteroidSummary,
  type MarsPhoto,
} from "../api/space";
import { ImageLightbox } from "../components/ImageLightbox";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api";

export function DashboardPage() {
  const cachedApod = getCachedApod();
  const cachedStats = getCachedAsteroidStats();
  const cachedFlares = getCachedSolarFlares();
  const cachedMars = getCachedMarsPhotos();

  // Pre-calculate cached chart data
  const initialChartData = (() => {
    if (!cachedFlares) return [];
    const grouped: Record<string, number> = {};
    cachedFlares.slice(0, 15).forEach((f) => {
      const dateStr = (f.startTime ?? "").split("T")[0];
      if (dateStr) {
        grouped[dateStr] = (grouped[dateStr] || 0) + 1;
      }
    });
    return Object.entries(grouped).map(([name, count]) => ({
      name,
      count,
    }));
  })();

  const [apod, setApod] = useState<ApodEntry | null>(cachedApod);
  const [asteroidStats, setAsteroidStats] = useState<AsteroidSummary | null>(cachedStats);
  const [flareCount, setFlareCount] = useState<number | null>(cachedFlares ? cachedFlares.length : null);
  const [marsPhoto, setMarsPhoto] = useState<MarsPhoto | null>(cachedMars && cachedMars.length > 0 ? cachedMars[0] : null);
  const [chartData, setChartData] = useState<{ name: string; count: number }[]>(initialChartData);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(!cachedApod || !cachedStats || !cachedFlares || !cachedMars);
  const [apodTab, setApodTab] = useState<"ai" | "raw">("raw");
  const [toast, setToast] = useState<{ message: string; type: string } | null>(null);
  const [showLightbox, setShowLightbox] = useState(false);

  // WebSocket for Realtime alerts
  useEffect(() => {
    const wsUrl = API_BASE_URL.replace(/^http/, "ws") + "/ws";
    const socket = new WebSocket(wsUrl);

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === "space_weather_alert") {
          setToast({
            message: `New Space Weather Alert: ${message.data.event_type} event detected!`,
            type: message.data.event_type,
          });
          // Auto close toast after 6 seconds
          const timer = setTimeout(() => setToast(null), 6000);
          return () => clearTimeout(timer);
        }
      } catch (err) {
        console.error("Failed to parse websocket message", err);
      }
    };

    return () => {
      socket.close();
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      const hasCache = getCachedApod() && getCachedAsteroidStats() && getCachedSolarFlares() && getCachedMarsPhotos();
      if (!hasCache) {
        setIsLoading(true);
      }
      setError("");

      const [apodResponse, asteroidResponse, flareResponse, marsResponse] =
        await Promise.allSettled([
          getApodToday(),
          getAsteroidStats(),
          getSolarFlares(),
          getMarsPhotos(),
          getWeatherAlerts(), // Populates DB notifications and triggers WS broadcasts
        ]);

      if (!isMounted) return;

      if (apodResponse.status === "fulfilled") {
        setApod(apodResponse.value.data);
      }

      if (asteroidResponse.status === "fulfilled") {
        setAsteroidStats(asteroidResponse.value.data);
      }

      if (flareResponse.status === "fulfilled") {
        const flares = flareResponse.value.data;
        setFlareCount(flares.length);

        // Group solar flares by date for the chart
        const grouped: Record<string, number> = {};
        flares.slice(0, 15).forEach((f) => {
          const dateStr = (f.startTime ?? "").split("T")[0];
          if (dateStr) {
            grouped[dateStr] = (grouped[dateStr] || 0) + 1;
          }
        });
        const formattedChart = Object.entries(grouped)
          .map(([key, val]) => ({ name: key, count: val }))
          .sort((a, b) => a.name.localeCompare(b.name));
        setChartData(formattedChart);
      }

      if (marsResponse.status === "fulfilled") {
        setMarsPhoto(marsResponse.value.data[0] ?? null);
      }

      const failedFeeds = [
        apodResponse,
        asteroidResponse,
        flareResponse,
        marsResponse,
      ].filter((response) => response.status === "rejected").length;

      if (failedFeeds > 0) {
        setError(`${failedFeeds} live feed${failedFeeds === 1 ? "" : "s"} could not load right now.`);
      }

      setIsLoading(false);
    }

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  const dashboardCards = [
    {
      title: "Asteroid Watch",
      value: asteroidStats ? `${asteroidStats.total}` : "...",
      description: asteroidStats
        ? `${asteroidStats.hazardous} potentially hazardous near-earth objects tracked.`
        : "Near-earth object monitoring and hazard context.",
      icon: Orbit,
      glow: "border-space-signal/20",
    },
    {
      title: "Space Weather",
      value: flareCount === null ? "..." : `${flareCount}`,
      description: "Solar flares reported by DONKI in the current monitoring window.",
      icon: Activity,
      glow: "border-purple-500/20",
    },
    {
      title: "Mars Explorer",
      value: marsPhoto ? "Live" : "...",
      description: marsPhoto?.title ?? "Curiosity rover imagery through NASA data sources.",
      icon: Image,
      glow: "border-orange-500/20",
    },
    {
      title: "Alerts",
      value: asteroidStats?.hazardous ? `${asteroidStats.hazardous}` : "0",
      description: "Initial alert signal based on hazardous asteroid count.",
      icon: Bell,
      glow: asteroidStats?.hazardous ? "border-red-500/30 neon-glow-amber animate-pulse" : "border-space-line/20",
    },
  ];

  return (
    <section className="mx-auto max-w-6xl px-6 py-10 relative">
      {/* Realtime Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex max-w-md items-center gap-3 rounded-lg border border-space-signal/30 bg-black/90 p-4 text-sm text-white shadow-2xl backdrop-blur-md animate-bounce">
          <Sparkles className="h-5 w-5 text-space-signal shrink-0" />
          <p className="font-semibold">{toast.message}</p>
          <button className="text-slate-400 hover:text-white" onClick={() => setToast(null)} type="button">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-8">
          <div>
            <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight bg-gradient-to-r from-space-frost via-space-signal to-white bg-clip-text text-transparent">
              Live NASA data, translated into useful intelligence.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
              APOD, asteroid stats, space weather, and Mars imagery are flowing through the
              FastAPI backend with automated Gemini insights.
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-3 rounded-lg border border-red-500/50 bg-red-950/30 p-4 text-sm text-red-100">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <p>{error}</p>
            </div>
          )}

          {/* Cards Grid */}
          <div className="grid gap-4 sm:grid-cols-2">
            {dashboardCards.map((card) => {
              const Icon = card.icon;

              return (
                <article
                  className={`rounded-lg border glass-card glass-card-hover p-5 ${card.glow}`}
                  key={card.title}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-base font-bold text-space-frost">{card.title}</h2>
                      <p className="mt-2 text-xs leading-5 text-slate-400">{card.description}</p>
                    </div>
                    <span className="p-2 rounded-md bg-white/5 border border-white/10">
                      <Icon className="h-5 w-5 text-space-signal" aria-hidden="true" />
                    </span>
                  </div>
                  <p className="mt-5 text-3xl font-extrabold text-space-amber">
                    {isLoading ? "..." : card.value}
                  </p>
                </article>
              );
            })}
          </div>

          {/* Data Charts Section */}
          {!isLoading && chartData.length > 0 && (
            <article className="rounded-lg border border-white/5 glass-card p-6">
              <h2 className="text-lg font-bold text-space-frost flex items-center gap-2">
                <Activity className="h-5 w-5 text-space-signal" />
                Solar Flare Frequency Trend
              </h2>
              <div className="mt-6 h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorFlares" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#39c0d4" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#39c0d4" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#0b0c10", borderColor: "rgba(255,255,255,0.1)", borderRadius: 8 }}
                      labelStyle={{ color: "#e7eef7", fontWeight: "bold" }}
                    />
                    <Area type="monotone" dataKey="count" stroke="#39c0d4" strokeWidth={2} fillOpacity={1} fill="url(#colorFlares)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </article>
          )}
        </div>

        {/* APOD Right Panel */}
        <aside className="overflow-hidden rounded-lg border border-white/5 glass-card flex flex-col justify-between">
          <div>
            {apod?.media_type === "image" && apod.url ? (
              <div 
                className="relative group overflow-hidden cursor-pointer"
                onClick={() => setShowLightbox(true)}
              >
                <img
                  alt={apod.title ?? "NASA astronomy picture of the day"}
                  className="aspect-video w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  src={apod.url}
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition duration-300 flex items-center justify-center pointer-events-none">
                  <span className="rounded-lg bg-black/60 px-3 py-1.5 text-xs font-semibold text-white border border-white/10">View Full Screen</span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent pointer-events-none" />
              </div>
            ) : null}

            <div className="p-6">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div className="flex items-center gap-2 text-space-signal">
                  <Rocket className="h-5 w-5" aria-hidden="true" />
                  <p className="text-xs uppercase tracking-wider font-semibold">APOD Intelligence</p>
                </div>

                {/* Tab buttons */}
                <div className="inline-flex rounded-md bg-white/5 p-1 text-xs">
                  <button
                    className={`rounded px-2.5 py-1 transition ${apodTab === "raw" ? "bg-space-signal text-space-ink font-bold" : "text-slate-400"}`}
                    onClick={() => setApodTab("raw")}
                    type="button"
                  >
                    Full Text
                  </button>
                  <button
                    className={`rounded px-2.5 py-1 transition ${apodTab === "ai" ? "bg-space-signal text-space-ink font-bold" : "text-slate-400"}`}
                    onClick={() => setApodTab("ai")}
                    type="button"
                  >
                    AI Summary
                  </button>
                </div>
              </div>

              <h2 className="mt-4 text-xl font-bold tracking-tight text-space-frost">{apod?.title ?? "Loading APOD..."}</h2>

              {apodTab === "ai" ? (
                <div className="mt-4 space-y-4">
                  {apod?.ai_summary ? (
                    <p className="text-sm leading-7 text-slate-300 whitespace-pre-wrap italic">
                      {apod.ai_summary}
                    </p>
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <Sparkles className="h-4 w-4 text-space-amber animate-spin" />
                      <span>{isLoading ? "Generating AI summary..." : "AI summary is being generated in the background. Please refresh in a few seconds..."}</span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="mt-4 text-sm leading-7 text-slate-300 line-clamp-[8]">
                  {apod?.explanation ?? "Daily NASA media description will appear here."}
                </p>
              )}
            </div>
          </div>

          {apod?.date && (
            <div className="px-6 pb-6 pt-3 flex justify-between items-center text-xs text-slate-400 border-t border-white/5">
              <span>{apod.copyright ? `© ${apod.copyright}` : "NASA Public Domain"}</span>
              <span className="font-bold text-space-amber">{apod.date}</span>
            </div>
          )}
        </aside>
      </div>

      {showLightbox && apod?.url && (
        <ImageLightbox
          imageUrl={apod.url}
          title={apod.title ?? "Astronomy Picture of the Day"}
          description={apod.explanation}
          date={apod.date}
          onClose={() => setShowLightbox(false)}
        />
      )}
    </section>
  );
}
