import { useEffect, useState } from "react";
import { Activity, AlertTriangle, Globe, Radio, Sparkles, Sun, X } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

import { getWeatherAlerts, getCachedWeatherAlerts, analyzeWeatherAlert, type SpaceWeatherAlert } from "../api/space";

type AlertItem = SpaceWeatherAlert;

export function SpaceWeatherPage() {
  const cached = getCachedWeatherAlerts();
  const [alerts, setAlerts] = useState<AlertItem[]>(cached || []);
  const [isLoading, setIsLoading] = useState(!cached);
  const [error, setError] = useState("");
  const [selectedAlert, setSelectedAlert] = useState<AlertItem | null>(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiError, setAiError] = useState("");

  const handleSelectAlert = async (alert: AlertItem) => {
    setSelectedAlert(alert);
    setAiError("");

    if (!alert.ai_explanation) {
      setIsGeneratingAi(true);
      try {
        const response = await analyzeWeatherAlert(alert.id);
        const updatedAlert = response.data;
        setSelectedAlert(updatedAlert);
        setAlerts((prev) =>
          prev.map((a) => (a.id === alert.id ? updatedAlert : a))
        );
      } catch (err) {
        setAiError("Gemini failed to generate analysis for this event.");
        console.error(err);
      } finally {
        setIsGeneratingAi(false);
      }
    }
  };

  // Stats calculation
  const flaresCount = alerts.filter((a) => a.event_type === "FLR").length;
  const cmesCount = alerts.filter((a) => a.event_type === "CME").length;
  const stormsCount = alerts.filter((a) => a.event_type === "GST").length;

  const chartData = [
    { name: "Flares", count: flaresCount, fill: "#e7c354" },
    { name: "CMEs", count: cmesCount, fill: "#af54e7" },
    { name: "Storms", count: stormsCount, fill: "#39c0d4" },
  ];

  useEffect(() => {
    let isMounted = true;

    async function loadWeather() {
      if (!getCachedWeatherAlerts()) {
        setIsLoading(true);
      }
      setError("");

      try {
        const response = await getWeatherAlerts();
        if (isMounted) {
          setAlerts(response.data);
        }
      } catch {
        if (isMounted && !getCachedWeatherAlerts()) {
          setError("Unable to load space weather alerts.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadWeather();

    return () => {
      isMounted = false;
    };
  }, []);

  const getEventName = (type: string) => {
    switch (type) {
      case "FLR":
        return "Solar Flare";
      case "CME":
        return "Coronal Mass Ejection";
      case "GST":
        return "Geomagnetic Storm";
      default:
        return "Space Weather Event";
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case "FLR":
        return <Sun className="h-5 w-5 text-yellow-400" />;
      case "CME":
        return <Radio className="h-5 w-5 text-purple-400" />;
      case "GST":
        return <Globe className="h-5 w-5 text-cyan-400" />;
      default:
        return <Activity className="h-5 w-5 text-slate-400" />;
    }
  };

  const parseDetails = (detailsStr: string) => {
    try {
      return JSON.parse(detailsStr);
    } catch {
      return {};
    }
  };

  return (
    <section className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex flex-wrap items-end justify-between gap-6 border-b border-white/5 pb-6">
        <div>
          <p className="text-xs uppercase tracking-wider text-space-signal font-semibold font-mono">DONKI Realtime Monitor</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white">Space Weather</h1>
        </div>
      </div>

      {error && (
        <div className="mt-6 flex items-start gap-3 rounded-lg border border-red-500/50 bg-red-950/30 p-4 text-sm text-red-100">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p>{error}</p>
        </div>
      )}

      {/* Grid containing Stats & Chart */}
      <div className="mt-8 grid gap-6 md:grid-cols-[1.2fr_0.8fr]">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: "Solar Flares", value: flaresCount, color: "text-yellow-400", bg: "border-yellow-500/10" },
            { label: "CME Events", value: cmesCount, color: "text-purple-400", bg: "border-purple-500/10" },
            { label: "Geomagnetic Storms", value: stormsCount, color: "text-cyan-400", bg: "border-cyan-500/10" },
          ].map((item) => (
            <article className={`rounded-xl border glass-card p-5 ${item.bg}`} key={item.label}>
              <Activity className={`h-5 w-5 ${item.color}`} aria-hidden="true" />
              <h2 className="mt-4 text-xs font-bold uppercase tracking-wider text-slate-400">{item.label}</h2>
              <p className={`mt-2 text-3xl font-extrabold ${item.color}`}>
                {isLoading ? "..." : item.value}
              </p>
            </article>
          ))}
        </div>

        {/* Visual Chart */}
        {!isLoading && alerts.length > 0 && (
          <article className="rounded-xl border border-white/5 glass-card p-5 flex flex-col justify-center">
            <h3 className="text-xs uppercase font-bold tracking-wider text-slate-400 mb-4">Event Severity Distribution</h3>
            <div className="h-[120px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical">
                  <XAxis type="number" stroke="#64748b" fontSize={10} hide />
                  <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0b0c10", borderColor: "rgba(255,255,255,0.1)", borderRadius: 8 }}
                    labelStyle={{ color: "#e7eef7", fontWeight: "bold" }}
                  />
                  <Bar dataKey="count" radius={4} barSize={12} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </article>
        )}
      </div>

      {/* Alerts Feed */}
      <div className="mt-8 rounded-xl border border-white/5 glass-card overflow-hidden">
        <div className="border-b border-white/5 bg-white/[0.01] px-5 py-4">
          <h2 className="font-extrabold text-white text-md tracking-tight">Active Space Weather Feed</h2>
          <p className="text-xs text-slate-400 mt-1">Select an event below to view Gemini AI analysis and atmospheric impacts.</p>
        </div>
        <div className="divide-y divide-white/5">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div className="h-16 w-full bg-white/5 animate-pulse" key={i} />
            ))
          ) : alerts.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-400">No active alerts found.</div>
          ) : (
            alerts.map((alert) => {
              const detailsObj = parseDetails(alert.details);
              return (
                <div
                  className="flex flex-wrap items-center justify-between gap-4 p-5 transition hover:bg-white/[0.02] cursor-pointer"
                  key={alert.event_id}
                  onClick={() => handleSelectAlert(alert)}
                >
                  <div className="flex items-center gap-4">
                    <span className="p-2.5 rounded-lg border border-white/10 bg-white/5">
                      {getEventIcon(alert.event_type)}
                    </span>
                    <div>
                      <p className="font-bold text-space-frost text-sm">{getEventName(alert.event_type)}</p>
                      <p className="text-xs text-slate-400 mt-1 font-mono">{alert.event_id}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 text-xs">
                    <div className="hidden sm:block">
                      <span className="text-slate-500 block uppercase font-bold tracking-wider text-[10px]">Start Time</span>
                      <span className="text-slate-300 font-semibold">{alert.start_time}</span>
                    </div>

                    {alert.event_type === "FLR" && (
                      <div>
                        <span className="text-slate-500 block uppercase font-bold tracking-wider text-[10px]">Class Type</span>
                        <span className="text-yellow-400 font-bold font-mono">{detailsObj.classType || "N/A"}</span>
                      </div>
                    )}

                    <span className="inline-flex items-center gap-1.5 rounded-md border border-space-signal/20 bg-space-signal/5 px-2.5 py-1 text-xs text-space-signal hover:bg-space-signal/15">
                      <Sparkles className="h-3.5 w-3.5" /> Analyze
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Details explanation modal */}
      {selectedAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-lg">
          <div className="relative max-w-xl w-full rounded-2xl border border-white/10 bg-slate-950 p-6 shadow-2xl flex flex-col justify-between">
            <button
              className="absolute top-4 right-4 p-2 rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/10 transition"
              onClick={() => setSelectedAlert(null)}
              type="button"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <span className="p-3 rounded-xl border border-white/10 bg-white/5">
                  {getEventIcon(selectedAlert.event_type)}
                </span>
                <div>
                  <h3 className="text-lg font-bold text-white">{getEventName(selectedAlert.event_type)} Analysis</h3>
                  <p className="text-xs text-space-signal font-mono mt-0.5">{selectedAlert.event_id}</p>
                </div>
              </div>

              {/* Gemini AI explanation card */}
              <div className="rounded-xl border border-space-signal/20 bg-space-signal/[0.02] p-5">
                <div className="flex items-center gap-2 text-space-signal text-xs uppercase tracking-wider font-bold mb-3">
                  <Sparkles className="h-4 w-4" />
                  Gemini AI Summary & Impact
                </div>
                {selectedAlert.ai_explanation ? (
                  <p className="text-sm leading-7 text-slate-200 whitespace-pre-wrap">
                    {selectedAlert.ai_explanation}
                  </p>
                ) : isGeneratingAi ? (
                  <div className="flex items-center gap-2 text-sm text-slate-400 py-2">
                    <Sparkles className="h-4 w-4 text-space-amber animate-spin" />
                    <span>Gemini is generating analysis...</span>
                  </div>
                ) : aiError ? (
                  <p className="text-sm text-red-300 font-semibold py-2">{aiError}</p>
                ) : (
                  <p className="text-sm text-slate-400 italic">No AI explanation is currently cached for this event.</p>
                )}
              </div>

              {/* Raw NASA fields */}
              <div className="rounded-xl border border-white/5 bg-white/[0.01] p-4 text-xs space-y-2">
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-slate-500">Event Start Time</span>
                  <span className="text-slate-300 font-semibold">{selectedAlert.start_time}</span>
                </div>
                {Object.entries(parseDetails(selectedAlert.details)).slice(0, 5).map(([key, val]) => (
                  <div className="flex justify-between border-b border-white/5 last:border-0 pb-2 last:pb-0" key={key}>
                    <span className="text-slate-500 capitalize">{key.replace(/([A-Z])/g, " $1")}</span>
                    <span className="text-slate-300 font-semibold truncate max-w-[200px]">{String(val)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-white/5 flex justify-end">
              <button
                className="inline-flex h-10 items-center justify-center rounded-lg bg-white/5 border border-white/10 px-6 text-sm font-semibold text-white hover:bg-white/10 transition"
                onClick={() => setSelectedAlert(null)}
                type="button"
              >
                Close Analysis
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
