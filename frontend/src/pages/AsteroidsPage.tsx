import { useEffect, useState } from "react";
import { AlertTriangle, Orbit } from "lucide-react";

import { getAsteroids, getCachedAsteroids, getHazardousAsteroids, getCachedHazardousAsteroids, type Asteroid } from "../api/space";

function formatNumber(value?: number) {
  return typeof value === "number" ? Math.round(value).toLocaleString() : "Unknown";
}

export function AsteroidsPage() {
  const cachedAll = getCachedAsteroids();
  const cachedHaz = getCachedHazardousAsteroids();
  const [asteroids, setAsteroids] = useState<Asteroid[]>(cachedAll || []);
  const [hazardous, setHazardous] = useState<Asteroid[]>(cachedHaz || []);
  const [isLoading, setIsLoading] = useState(!cachedAll || !cachedHaz);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadAsteroids() {
      const hasCache = getCachedAsteroids() && getCachedHazardousAsteroids();
      if (!hasCache) {
        setIsLoading(true);
      }
      setError("");

      try {
        const [allResponse, hazardousResponse] = await Promise.all([
          getAsteroids(),
          getHazardousAsteroids(),
        ]);

        if (isMounted) {
          setAsteroids(allResponse.data);
          setHazardous(hazardousResponse.data);
        }
      } catch {
        if (isMounted) {
          setError("Unable to load asteroid data.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadAsteroids();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-space-signal font-semibold font-mono">NeoWs Monitor</p>
          <h1 className="mt-2 text-3xl font-extrabold text-white">Near-Earth Asteroids</h1>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl border border-white/5 glass-card p-4">
            <p className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Tracked</p>
            <p className="mt-1 text-2xl font-extrabold text-space-amber">{isLoading ? "..." : asteroids.length}</p>
          </div>
          <div className="rounded-xl border border-white/5 glass-card p-4">
            <p className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Hazardous</p>
            <p className="mt-1 text-2xl font-extrabold text-red-400">{isLoading ? "..." : hazardous.length}</p>
          </div>
        </div>
      </div>

      {error ? (
        <div className="mt-6 flex items-start gap-3 rounded-lg border border-red-500/50 bg-red-950/30 p-4 text-sm text-red-100">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p>{error}</p>
        </div>
      ) : null}

      <div className="mt-6 grid gap-4">
        {asteroids.slice(0, 12).map((asteroid) => (
          <article className="rounded-xl border border-white/5 glass-card glass-card-hover p-5" key={asteroid.id ?? asteroid.name}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Orbit className="h-4 w-4 text-space-signal" aria-hidden="true" />
                  <h2 className="font-bold text-space-frost">{asteroid.name}</h2>
                </div>
                <p className="mt-2 text-xs text-slate-400 font-medium">
                  Close approach: <span className="text-slate-300 font-bold">{asteroid.close_approach_date ?? "Unknown"}</span>
                </p>
              </div>
              <span className={`rounded-md border px-3 py-1 text-xs font-semibold ${
                asteroid.is_potentially_hazardous 
                  ? "border-red-500/30 bg-red-500/10 text-red-400 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.1)]" 
                  : "border-white/10 bg-white/5 text-slate-300"
              }`}>
                {asteroid.is_potentially_hazardous ? "Hazardous" : "Normal"}
              </span>
            </div>
            <div className="mt-4 grid gap-3 text-xs text-slate-400 sm:grid-cols-3 border-t border-white/5 pt-4">
              <p>Miss distance: <span className="text-slate-200 font-semibold">{formatNumber(asteroid.miss_distance_km)} km</span></p>
              <p>Velocity: <span className="text-slate-200 font-semibold">{formatNumber(asteroid.relative_velocity_kph)} km/h</span></p>
              <p>Max diameter: <span className="text-slate-200 font-semibold">{formatNumber(asteroid.estimated_diameter_max_m)} m</span></p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

