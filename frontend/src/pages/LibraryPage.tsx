import { FormEvent, useState, useEffect, useCallback } from "react";
import { Search, Image as ImageIcon, Info, HelpCircle, Calendar } from "lucide-react";
import { searchLibrary, getCachedLibrarySearch, type LibraryImage } from "../api/space";
import { ImageLightbox } from "../components/ImageLightbox";

const PRESET_TAGS = ["Sun", "Moon", "Galaxy", "Nebula", "Apollo", "Mars"];

export function LibraryPage() {
  const cached = getCachedLibrarySearch("Sun");
  const [query, setQuery] = useState("Sun");
  const [results, setResults] = useState<LibraryImage[]>(cached || []);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Lightbox state
  const [selectedImage, setSelectedImage] = useState<LibraryImage | null>(null);

  const handleSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim() || isLoading) return;
    const cachedResults = getCachedLibrarySearch(searchQuery);
    if (cachedResults) {
      setResults(cachedResults);
    } else {
      setIsLoading(true);
    }
    setError("");
    try {
      const response = await searchLibrary(searchQuery);
      setResults(response.data);
    } catch {
      if (!getCachedLibrarySearch(searchQuery)) {
        setError("Failed to reach NASA archives. Please try your search again.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  useEffect(() => {
    // Initial search
    handleSearch("Sun");
  }, [handleSearch]);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    handleSearch(query);
  }

  function onTagClick(tag: string) {
    setQuery(tag);
    handleSearch(tag);
  }

  return (
    <section className="mx-auto max-w-6xl px-6 py-10">
      {/* Header */}
      <div className="border-b border-white/5 pb-6 mb-8">
        <p className="text-xs uppercase tracking-wider text-space-signal font-semibold font-mono">Astronomy Database</p>
        <h1 className="mt-2 text-3xl font-extrabold text-white">Space Image Search Library</h1>
      </div>

      {/* Search Panel */}
      <article className="rounded-xl border border-white/5 bg-white/[0.01] backdrop-blur-md p-6 glass-card mb-8">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Query NASA Archives</h2>
        <p className="text-xs text-slate-400 mt-1 mb-4">Enter any space keyword to search NASA's public media library.</p>
        
        <form className="flex gap-2" onSubmit={onSubmit}>
          <input
            className="flex-1 h-11 rounded-lg border border-white/10 bg-white/5 px-4 text-sm text-white placeholder-slate-500 outline-none focus:border-space-signal transition"
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for Sun, Moon, Apollo, Hubble, Milky Way..."
            type="text"
            value={query}
          />
          <button
            className="inline-flex h-11 items-center gap-2 rounded-lg bg-space-signal px-6 text-sm font-bold text-space-ink transition hover:bg-cyan-300 disabled:opacity-50"
            disabled={isLoading || !query.trim()}
            type="submit"
          >
            <Search className="h-4 w-4" />
            {isLoading ? "Searching..." : "Search"}
          </button>
        </form>

        {/* Preset quick-filter tags */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-500 font-bold uppercase tracking-wider font-mono mr-1">Quick Tags:</span>
          {PRESET_TAGS.map((tag) => (
            <button
              className={[
                "rounded-full border px-3.5 py-1 text-xs font-semibold transition",
                query.toLowerCase() === tag.toLowerCase()
                  ? "bg-space-signal/15 border-space-signal/30 text-space-signal"
                  : "border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:text-white",
              ].join(" ")}
              key={tag}
              onClick={() => onTagClick(tag)}
              type="button"
            >
              {tag}
            </button>
          ))}
        </div>
      </article>

      {error && (
        <div className="rounded-xl border border-red-500/50 bg-red-950/20 p-4 text-sm text-red-200 mb-8 flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-red-400 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Empty States */}
      {!isLoading && results.length === 0 && (
        <div className="flex flex-col items-center justify-center text-center p-16 border border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
          <ImageIcon className="h-12 w-12 text-slate-500 mb-4" />
          <h3 className="text-lg font-bold text-white">No Images Found</h3>
          <p className="text-sm text-slate-400 mt-2 max-w-sm">
            NASA didn't return any image results for your query. Try searching for broader terms like "satellite", "star", or "astronaut".
          </p>
        </div>
      )}

      {/* Grid view */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {(isLoading ? Array.from({ length: 6 }) : results).map((image, index) => {
          const item = image as LibraryImage;
          if (isLoading) {
            return (
              <div className="aspect-[4/3] w-full rounded-xl bg-white/5 animate-pulse border border-white/5" key={index} />
            );
          }

          return (
            <article
              className="group overflow-hidden rounded-xl border border-white/5 bg-white/[0.01] backdrop-blur-md glass-card-hover flex flex-col justify-between"
              key={item.nasa_id + index}
            >
              <div 
                className="relative overflow-hidden cursor-pointer aspect-[4/3] bg-black"
                onClick={() => setSelectedImage(item)}
              >
                {item.thumbnail_url ? (
                  <img
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                    src={item.thumbnail_url}
                  />
                ) : (
                  <div className="w-full h-full grid place-items-center">
                    <ImageIcon className="h-8 w-8 text-space-signal" />
                  </div>
                )}
                
                {/* Fullscreen Overlay trigger */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                  <span className="text-xs text-white font-medium flex items-center gap-1.5 bg-black/60 px-2.5 py-1.5 rounded-md backdrop-blur-sm">
                    <Info className="h-3.5 w-3.5" /> View & Download
                  </span>
                </div>
              </div>

              {/* Title & Metadata Card */}
              <div className="p-4 space-y-1">
                <h3 className="line-clamp-1 text-sm font-bold text-space-frost leading-tight">{item.title}</h3>
                <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
                  <Calendar className="h-3 w-3 text-space-amber" />
                  <span>{item.date || "NASA Archival Record"}</span>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* Reusable Image Lightbox overlay */}
      {selectedImage && (
        <ImageLightbox
          date={selectedImage.date}
          description={selectedImage.description}
          imageUrl={selectedImage.high_res_url}
          onClose={() => setSelectedImage(null)}
          title={selectedImage.title}
        />
      )}
    </section>
  );
}
