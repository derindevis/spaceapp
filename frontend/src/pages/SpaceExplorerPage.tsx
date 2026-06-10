import { useEffect, useState, useRef } from "react";
import { AlertTriangle, ArrowLeft, ArrowRight, Compass, Globe, Info, Orbit, User, Users } from "lucide-react";
import { getEarthEpic, getIssPosition, getSpaceCrew } from "../api/space";
import { ImageLightbox } from "../components/ImageLightbox";

type EpicImage = {
  identifier: string;
  image: string;
  url: string;
  date: string;
  caption: string;
  coords: {
    lat: number;
    lon: number;
  };
};

type CrewMember = {
  name: string;
  craft: string;
  agency?: string;
  country?: string;
  flag_code?: string;
  position?: string;
  days_in_space?: number;
  image?: string;
  url?: string;
};

export function SpaceExplorerPage() {
  const [epicImages, setEpicImages] = useState<EpicImage[]>([]);
  const [currentEpicIndex, setCurrentEpicIndex] = useState(0);
  const [issPosition, setIssPosition] = useState<{ latitude: number; longitude: number } | null>(null);
  const [crew, setCrew] = useState<CrewMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [showLightbox, setShowLightbox] = useState(false);
  
  const pollIntervalRef = useRef<number | null>(null);

  // Load static/initial feeds
  useEffect(() => {
    let isMounted = true;
    
    async function loadInitialData() {
      setIsLoading(true);
      setError("");
      
      try {
        const [epicRes, crewRes] = await Promise.all([
          getEarthEpic(),
          getSpaceCrew(),
        ]);
        
        if (isMounted) {
          setEpicImages(epicRes.data as EpicImage[]);
          setCrew(crewRes.data);
        }
      } catch {
        if (isMounted) {
          setError("Failed to load initial space exploration feeds.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadInitialData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Poll ISS position
  useEffect(() => {
    let isMounted = true;

    async function fetchIss() {
      try {
        const response = await getIssPosition();
        if (isMounted) {
          setIssPosition(response.data);
        }
      } catch (err) {
        console.error("Failed to poll ISS position", err);
      }
    }

    fetchIss();
    pollIntervalRef.current = window.setInterval(fetchIss, 6000); // Poll every 6 seconds

    return () => {
      isMounted = false;
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  const handleNextEpic = () => {
    if (epicImages.length === 0) return;
    setCurrentEpicIndex((prev) => (prev + 1) % epicImages.length);
  };

  const handlePrevEpic = () => {
    if (epicImages.length === 0) return;
    setCurrentEpicIndex((prev) => (prev - 1 + epicImages.length) % epicImages.length);
  };

  const currentEpic = epicImages[currentEpicIndex];

  return (
    <section className="mx-auto max-w-6xl px-6 py-10 relative">
      <div className="border-b border-white/5 pb-6 mb-8">
        <p className="text-xs uppercase tracking-wider text-space-signal font-semibold font-mono">Mission Control</p>
        <h1 className="mt-2 text-3xl font-extrabold text-white">Space Exploratory Portal</h1>
      </div>

      {error && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-500/50 bg-red-950/30 p-4 text-sm text-red-100">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p>{error}</p>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        
        {/* NASA EPIC Earth Observatory */}
        <article className="rounded-xl border border-white/5 glass-card overflow-hidden flex flex-col justify-between">
          <div className="border-b border-white/5 bg-white/[0.01] px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-space-signal">
              <Globe className="h-5 w-5 animate-spin" style={{ animationDuration: "12s" }} />
              <h2 className="font-extrabold text-white text-md tracking-tight">EPIC Earth Observatory</h2>
            </div>
            <span className="text-[10px] bg-white/5 border border-white/10 px-2.5 py-1 rounded text-slate-400 font-bold uppercase tracking-wider font-mono">
              DSCOVR Satellite
            </span>
          </div>

          <div className="p-6 flex-1 flex flex-col justify-center">
            {isLoading ? (
              <div className="aspect-square max-w-[350px] mx-auto w-full bg-white/5 animate-pulse rounded-full" />
            ) : currentEpic ? (
              <div className="space-y-6">
                <div 
                  className="relative aspect-square max-w-[340px] mx-auto w-full group overflow-hidden rounded-full border-2 border-white/10 glow-border bg-black cursor-pointer shadow-2xl"
                  onClick={() => setShowLightbox(true)}
                >
                  <img
                    alt={currentEpic.caption}
                    className="w-full h-full object-cover transition-transform duration-750 group-hover:scale-105"
                    src={currentEpic.url}
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition duration-300 flex items-center justify-center pointer-events-none">
                    <span className="rounded-lg bg-black/60 px-3 py-1.5 text-xs font-semibold text-white border border-white/10">View Full Screen</span>
                  </div>
                  <div className="absolute inset-0 bg-radial-gradient(circle_at_center,transparent_45%,rgba(0,0,0,0.6)_100%) pointer-events-none" />
                </div>

                {/* Slider Controls */}
                <div className="flex items-center justify-between max-w-[200px] mx-auto">
                  <button
                    className="p-2 rounded-full border border-white/10 bg-white/5 text-slate-400 hover:text-white transition"
                    onClick={handlePrevEpic}
                    type="button"
                  >
                    <ArrowLeft className="h-4.5 w-4.5" />
                  </button>
                  <span className="text-xs text-slate-400 font-bold font-mono">
                    {currentEpicIndex + 1} / {epicImages.length}
                  </span>
                  <button
                    className="p-2 rounded-full border border-white/10 bg-white/5 text-slate-400 hover:text-white transition"
                    onClick={handleNextEpic}
                    type="button"
                  >
                    <ArrowRight className="h-4.5 w-4.5" />
                  </button>
                </div>

                {/* Image Details */}
                <div className="text-center space-y-2 max-w-md mx-auto">
                  <h3 className="text-sm font-bold text-white leading-6">{currentEpic.caption}</h3>
                  <p className="text-xs text-space-amber font-mono font-bold">{currentEpic.date}</p>
                  
                  {currentEpic.coords && (
                    <div className="inline-flex items-center gap-1.5 rounded-full border border-white/5 bg-white/5 px-3 py-1 text-[10px] text-slate-400 font-semibold font-mono">
                      <Compass className="h-3.5 w-3.5" />
                      Lat: {currentEpic.coords.lat.toFixed(4)}° • Lon: {currentEpic.coords.lon.toFixed(4)}°
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center p-8 text-slate-400 text-sm">No observatory images available.</div>
            )}
          </div>
        </article>

        {/* Orbit tracker & crew directory */}
        <div className="space-y-8">
          
          {/* ISS Live Orbit Tracker */}
          <article className="rounded-xl border border-white/5 glass-card overflow-hidden">
            <div className="border-b border-white/5 bg-white/[0.01] px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-space-signal">
                <Orbit className="h-5 w-5 animate-pulse" />
                <h2 className="font-extrabold text-white text-md tracking-tight">ISS Live Orbit Tracker</h2>
              </div>
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" />
            </div>

            <div className="p-6">
              {issPosition ? (
                <div className="space-y-6">
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="rounded-xl border border-white/5 bg-white/[0.01] p-4 text-center">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Latitude</span>
                      <span className="text-2xl font-extrabold text-space-frost font-mono">
                        {issPosition.latitude.toFixed(5)}°
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-2 font-medium">
                        {issPosition.latitude >= 0 ? "North" : "South"} of Equator
                      </span>
                    </div>

                    <div className="rounded-xl border border-white/5 bg-white/[0.01] p-4 text-center">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Longitude</span>
                      <span className="text-2xl font-extrabold text-space-frost font-mono">
                        {issPosition.longitude.toFixed(5)}°
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-2 font-medium">
                        {issPosition.longitude >= 0 ? "East" : "West"} of Meridian
                      </span>
                    </div>
                  </div>

                  {/* 2D Grid Map Radar Overlay */}
                  <div className="relative h-[160px] bg-black/40 border border-white/5 rounded-xl overflow-hidden">
                    <svg className="w-full h-full opacity-35" viewBox="0 0 360 180" preserveAspectRatio="none">
                      {/* Equator & Meridian grid */}
                      <line x1="0" y1="90" x2="360" y2="90" stroke="rgba(57,192,212,0.6)" strokeWidth="0.8" strokeDasharray="3,3" />
                      <line x1="180" y1="0" x2="180" y2="180" stroke="rgba(57,192,212,0.6)" strokeWidth="0.8" strokeDasharray="3,3" />
                      
                      <line x1="0" y1="30" x2="360" y2="30" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
                      <line x1="0" y1="60" x2="360" y2="60" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
                      <line x1="0" y1="120" x2="360" y2="120" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
                      <line x1="0" y1="150" x2="360" y2="150" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />

                      <line x1="60" y1="0" x2="60" y2="180" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
                      <line x1="120" y1="0" x2="120" y2="180" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
                      <line x1="240" y1="0" x2="240" y2="180" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
                      <line x1="300" y1="0" x2="300" y2="180" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />

                      <text x="5" y="85" fill="#39c0d4" fontSize="7" fontFamily="monospace" opacity="0.8">Equator</text>
                      <text x="185" y="175" fill="#39c0d4" fontSize="7" fontFamily="monospace" opacity="0.8">Meridian</text>
                    </svg>

                    {/* Pulsating ISS marker */}
                    <div 
                      className="absolute"
                      style={{
                        left: `${((issPosition.longitude + 180) / 360) * 100}%`,
                        top: `${((90 - issPosition.latitude) / 180) * 100}%`,
                        transform: "translate(-50%, -50%)",
                      }}
                    >
                      <span className="flex h-6 w-6 items-center justify-center relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-space-signal opacity-60"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-space-signal border border-white shadow-lg"></span>
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-24 flex items-center justify-center text-sm text-slate-400">
                  Tracking space station...
                </div>
              )}

              <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-space-signal/20 bg-space-signal/[0.01] p-4 text-xs leading-5 text-slate-300">
                <Info className="h-4.5 w-4.5 shrink-0 text-space-signal mt-0.5" />
                <p>
                  The International Space Station orbits Earth at **17,500 mph (28,000 km/h)**, completing one loop every **90 minutes**. Its coordinates update in real time above.
                </p>
              </div>
            </div>
          </article>

          {/* Active Space Crew list */}
          <article className="rounded-xl border border-white/5 glass-card overflow-hidden">
            <div className="border-b border-white/5 bg-white/[0.01] px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-space-signal">
                <Users className="h-5 w-5" />
                <h2 className="font-extrabold text-white text-md tracking-tight">Active Space Crew</h2>
              </div>
              <span className="text-xs bg-space-amber/20 border border-space-amber/30 text-space-amber px-2.5 py-0.5 rounded-full font-bold font-mono">
                {isLoading ? "..." : crew.length} In Space
              </span>
            </div>

            <div className="max-h-[340px] overflow-y-auto divide-y divide-white/5">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div className="h-14 w-full bg-white/5 animate-pulse" key={i} />
                ))
              ) : crew.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-400">No astronauts recorded.</div>
              ) : (
                crew.map((member: CrewMember, i) => (
                  <div className="flex items-center justify-between p-4 hover:bg-white/[0.01] transition" key={member.name + i}>
                    <div className="flex items-center gap-3">
                      {member.image ? (
                        <img 
                          src={member.image} 
                          alt={member.name}
                          className="h-10 w-10 rounded-full border border-white/10 object-cover bg-space-ink"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <span className="grid h-10 w-10 place-items-center rounded-full bg-white/5 border border-white/10 text-slate-400">
                          <User className="h-4 w-4" />
                        </span>
                      )}
                      <div>
                        <span className="block text-sm font-semibold text-space-frost">{member.name}</span>
                        <span className="block text-[10px] text-slate-400 leading-none mt-1">
                          {member.position || "Crew Specialist"} • {member.agency || "Agency"}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-[10px] text-space-signal bg-space-signal/10 border border-space-signal/25 px-2 py-0.5 rounded font-mono uppercase tracking-wider font-bold">
                        {member.craft}
                      </span>
                      {member.days_in_space && (
                        <span className="text-[9px] font-mono text-space-amber font-semibold">
                          {member.days_in_space} Days Orbiting
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </article>

        </div>
      </div>

      {showLightbox && currentEpic && (
        <ImageLightbox
          imageUrl={currentEpic.url}
          title={currentEpic.caption}
          description={`Natural color image of Earth captured by the EPIC (Earth Polychromatic Imaging Camera) onboard the DSCOVR satellite, positioned 1 million miles away from Earth. Center coordinate coordinates: Lat: ${currentEpic.coords?.lat.toFixed(4)}°, Lon: ${currentEpic.coords?.lon.toFixed(4)}°.`}
          date={currentEpic.date}
          onClose={() => setShowLightbox(false)}
        />
      )}
    </section>
  );
}
