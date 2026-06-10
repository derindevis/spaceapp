import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Bookmark, BookmarkCheck, Grid, Heart, Image as ImageIcon, Info, SlidersHorizontal } from "lucide-react";

import { getMarsPhotos, saveMarsPhoto, getSavedMarsPhotos, deleteSavedMarsPhoto, type MarsPhoto } from "../api/space";
import { useAuth } from "../auth/useAuth";
import { ImageLightbox } from "../components/ImageLightbox";

export function MarsExplorerPage() {
  const { token } = useAuth();
  const [photos, setPhotos] = useState<MarsPhoto[]>([]);
  const [savedPhotos, setSavedPhotos] = useState<MarsPhoto[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<"all" | "saved">("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters state
  const [rover, setRover] = useState("curiosity");
  const [camera, setCamera] = useState("");
  const [sol, setSol] = useState(1000);

  // Lightbox modal state
  const [selectedPhoto, setSelectedPhoto] = useState<MarsPhoto | null>(null);

  // Load user saved photos
  const loadSavedPhotos = useCallback(async () => {
    if (!token) return;
    try {
      const response = await getSavedMarsPhotos(token);
      setSavedPhotos(response.data);
      const ids = new Set(response.data.map((p) => p.photo_id ?? p.id ?? ""));
      setSavedIds(ids);
    } catch (err) {
      console.error("Failed to load saved photos", err);
    }
  }, [token]);

  // Load photos from NASA / API
  const loadPhotos = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const params: { rover: string; sol: number; camera?: string } = { rover, sol };
      if (camera) params.camera = camera;
      const response = await getMarsPhotos(params);
      setPhotos(response.data);
    } catch {
      setError("Unable to load Mars imagery. Falling back to NASA archives.");
    } finally {
      setIsLoading(false);
    }
  }, [rover, camera, sol]);

  useEffect(() => {
    loadSavedPhotos();
  }, [loadSavedPhotos]);

  useEffect(() => {
    if (viewMode === "all") {
      loadPhotos();
    }
  }, [viewMode, loadPhotos]);

  const handleBookmarkToggle = async (photo: MarsPhoto) => {
    if (!token) return;
    const photoId = photo.id?.toString() ?? photo.photo_id ?? "";
    const isBookmarked = savedIds.has(photoId);

    try {
      if (isBookmarked) {
        await deleteSavedMarsPhoto(photoId, token);
        setSavedIds((prev) => {
          const next = new Set(prev);
          next.delete(photoId);
          return next;
        });
        setSavedPhotos((prev) => prev.filter((p) => (p.photo_id ?? p.id) !== photoId));
      } else {
        const payload = {
          photo_id: photoId,
          title: photo.title || `Mars Rover Photo #${photoId}`,
          img_src: photo.img_src || "",
          earth_date: photo.earth_date || "",
          rover: photo.rover || rover,
          camera: photo.camera || camera || "NAVCAM",
        };
        await saveMarsPhoto(payload, token);
        setSavedIds((prev) => {
          const next = new Set(prev);
          next.add(photoId);
          return next;
        });
        // Refresh saved list
        loadSavedPhotos();
      }
    } catch (err) {
      console.error("Bookmark toggle failed", err);
    }
  };

  const activePhotos = viewMode === "all" ? photos : savedPhotos;

  return (
    <section className="mx-auto max-w-6xl px-6 py-10 relative">
      <div className="flex flex-wrap items-center justify-between gap-6 border-b border-white/5 pb-6">
        <div>
          <p className="text-xs uppercase tracking-wider text-space-signal font-semibold">NASA Mars Explorer</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white">Rover Imagery</h1>
        </div>

        {/* View Mode Toggle */}
        <div className="inline-flex rounded-lg bg-white/5 p-1 text-sm border border-white/5">
          <button
            className={`flex items-center gap-2 rounded-md px-4 py-2 transition ${viewMode === "all" ? "bg-space-signal text-space-ink font-bold" : "text-slate-400 hover:text-white"}`}
            onClick={() => setViewMode("all")}
            type="button"
          >
            <Grid className="h-4 w-4" />
            All Photos
          </button>
          <button
            className={`flex items-center gap-2 rounded-md px-4 py-2 transition ${viewMode === "saved" ? "bg-space-signal text-space-ink font-bold" : "text-slate-400 hover:text-white"}`}
            onClick={() => setViewMode("saved")}
            type="button"
          >
            <Heart className="h-4 w-4" />
            Saved Gallery ({savedPhotos.length})
          </button>
        </div>
      </div>

      {/* Filter panel (only visible in "All Photos" view) */}
      {viewMode === "all" && (
        <div className="mt-6 grid gap-4 rounded-xl border border-white/5 bg-white/[0.01] backdrop-blur-md p-5 md:grid-cols-4 items-end">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Select Rover</label>
            <select
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-space-signal transition"
              onChange={(e) => setRover(e.target.value)}
              value={rover}
            >
              <option value="curiosity" className="bg-slate-950">Curiosity</option>
              <option value="opportunity" className="bg-slate-950">Opportunity</option>
              <option value="spirit" className="bg-slate-950">Spirit</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Select Camera</label>
            <select
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-space-signal transition"
              onChange={(e) => setCamera(e.target.value)}
              value={camera}
            >
              <option value="" className="bg-slate-950">All Cameras</option>
              <option value="fhaz" className="bg-slate-950">FHAZ (Front Hazard)</option>
              <option value="rhaz" className="bg-slate-950">RHAZ (Rear Hazard)</option>
              <option value="navcam" className="bg-slate-950">NAVCAM (Navigation)</option>
              <option value="mast" className="bg-slate-950">MAST (Mast Camera)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Martian Sol</label>
            <input
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-space-signal transition"
              min={0}
              onChange={(e) => setSol(parseInt(e.target.value) || 1000)}
              type="number"
              value={sol}
            />
          </div>

          <button
            className="w-full h-10 inline-flex items-center justify-center gap-2 rounded-lg border border-space-signal/30 bg-space-signal/10 text-space-signal text-sm font-semibold transition hover:bg-space-signal/20"
            onClick={loadPhotos}
            type="button"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Apply Filters
          </button>
        </div>
      )}

      {error && (
        <div className="mt-6 flex items-start gap-3 rounded-lg border border-red-500/50 bg-red-950/30 p-4 text-sm text-red-100">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p>{error}</p>
        </div>
      )}

      {/* Empty States */}
      {!isLoading && activePhotos.length === 0 && (
        <div className="mt-12 flex flex-col items-center justify-center text-center p-12 border border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
          <ImageIcon className="h-12 w-12 text-slate-500 mb-4" />
          <h3 className="text-lg font-bold text-white">No Photos Found</h3>
          <p className="text-sm text-slate-400 mt-2 max-w-sm">
            {viewMode === "all"
              ? "NASA didn't return any photos for this filter combination. Try altering the Martian Sol or camera type."
              : "You haven't bookmarked any Martian photos yet. Visit the 'All Photos' grid to add bookmarks."}
          </p>
        </div>
      )}

      {/* Photos Grid */}
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {(isLoading ? Array.from({ length: 6 }) : activePhotos).map((photo, index) => {
          const item = photo as MarsPhoto;
          if (isLoading) {
            return (
              <div className="aspect-video w-full rounded-lg bg-white/5 animate-pulse border border-white/5" key={index} />
            );
          }

          const photoId = item.id?.toString() ?? item.photo_id ?? "";
          const isBookmarked = savedIds.has(photoId);

          return (
            <article
              className="group overflow-hidden rounded-xl border border-white/5 bg-white/[0.01] backdrop-blur-md glass-card-hover flex flex-col justify-between"
              key={photoId}
            >
              <div className="relative overflow-hidden cursor-pointer" onClick={() => setSelectedPhoto(item)}>
                {item.img_src ? (
                  <img
                    alt={item.title ?? "Mars rover image"}
                    className="aspect-video w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    src={item.img_src}
                  />
                ) : (
                  <div className="grid aspect-video place-items-center bg-slate-950">
                    <ImageIcon className="h-8 w-8 text-space-signal" aria-hidden="true" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                  <span className="text-xs text-white font-medium flex items-center gap-1.5 bg-black/60 px-2.5 py-1.5 rounded-md backdrop-blur-sm">
                    <Info className="h-3.5 w-3.5" /> Click for details
                  </span>
                </div>
              </div>

              <div className="p-4 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <h2 className="line-clamp-1 text-sm font-bold text-space-frost">
                    {item.title ?? `Photo #${photoId}`}
                  </h2>
                  <p className="text-xs text-slate-400 font-medium">
                    Rover: <span className="text-space-signal capitalize">{item.rover ?? rover}</span> • Camera: <span className="text-space-amber uppercase">{item.camera ?? "NAVCAM"}</span>
                  </p>
                  <p className="text-[10px] text-slate-500">{item.earth_date || "NASA Imagery"}</p>
                </div>

                {/* Bookmark Button */}
                <button
                  className={`p-2 rounded-lg border transition ${isBookmarked ? "bg-space-signal/15 border-space-signal/30 text-space-signal" : "bg-white/5 border-white/10 text-slate-400 hover:text-white"}`}
                  onClick={() => handleBookmarkToggle(item)}
                  type="button"
                >
                  {isBookmarked ? <BookmarkCheck className="h-4.5 w-4.5" /> : <Bookmark className="h-4.5 w-4.5" />}
                </button>
              </div>
            </article>
          );
        })}
      </div>      {/* Lightbox Modal */}
      {selectedPhoto && selectedPhoto.img_src && (
        <ImageLightbox
          imageUrl={selectedPhoto.img_src}
          title={selectedPhoto.title ?? `Mars Photo #${selectedPhoto.photo_id ?? selectedPhoto.id}`}
          description={`This image was captured by the NASA Mars exploration rover ${selectedPhoto.rover || rover} using its on-board ${(selectedPhoto.camera || "NAVCAM").toUpperCase()} camera. Source: ${selectedPhoto.source ?? "NASA JPL Archives"}.`}
          date={`Earth Date: ${selectedPhoto.earth_date || "Unknown"}`}
          onClose={() => setSelectedPhoto(null)}
        />
      )}
    </section>
  );
}
