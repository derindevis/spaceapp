import { X, Download, ZoomIn, ZoomOut } from "lucide-react";
import { useState } from "react";

type ImageLightboxProps = {
  imageUrl: string;
  title: string;
  description?: string;
  date?: string;
  onClose: () => void;
};

export function ImageLightbox({ imageUrl, title, description, date, onClose }: ImageLightboxProps) {
  const [zoom, setZoom] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  async function handleDownload() {
    setIsDownloading(true);
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      // Determine file extension
      const extension = imageUrl.split(".").pop()?.split("?")[0] || "jpg";
      const cleanedTitle = title.toLowerCase().replace(/[^a-z0-9]/g, "_").slice(0, 30);
      const filename = `${cleanedTitle}_${date || "download"}.${extension}`;

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Download blocked by CORS, opening in new tab:", err);
      window.open(imageUrl, "_blank");
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-black/95 text-white backdrop-blur-md animate-fade-in">
      {/* Lightbox Header Controls */}
      <header className="flex h-16 items-center justify-between border-b border-white/5 bg-black/50 px-6 backdrop-blur-md">
        <div>
          <h2 className="text-sm font-bold text-white leading-none truncate max-w-[280px] sm:max-w-md">{title}</h2>
          {date && <p className="mt-1.5 text-[10px] font-mono text-space-amber leading-none">{date}</p>}
        </div>
        <div className="flex items-center gap-2">
          <button
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:text-white transition"
            onClick={() => setZoom(!zoom)}
            title={zoom ? "Zoom Out" : "Zoom In"}
            type="button"
          >
            {zoom ? <ZoomOut className="h-4 w-4" /> : <ZoomIn className="h-4 w-4" />}
          </button>
          <button
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-space-signal px-4 text-xs font-bold text-space-ink transition hover:bg-cyan-300 disabled:opacity-50"
            disabled={isDownloading}
            onClick={handleDownload}
            type="button"
          >
            <Download className="h-4 w-4" />
            {isDownloading ? "Downloading..." : "Download"}
          </button>
          <button
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:text-white transition"
            onClick={onClose}
            type="button"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Main Image Viewer Section */}
      <div className="relative flex-1 overflow-auto flex items-center justify-center p-4">
        <img
          alt={title}
          className={[
            "max-h-[80vh] max-w-full rounded-lg object-contain shadow-2xl transition-transform duration-300",
            zoom ? "scale-150 cursor-zoom-out" : "cursor-zoom-in",
          ].join(" ")}
          onClick={() => setZoom(!zoom)}
          src={imageUrl}
        />
      </div>

      {/* Lightbox Description footer if present */}
      {description && (
        <footer className="border-t border-white/5 bg-black/60 p-6 backdrop-blur-md max-h-[30vh] overflow-y-auto">
          <div className="mx-auto max-w-3xl">
            <h3 className="text-xs font-bold uppercase tracking-wider text-space-signal font-mono">Image Description</h3>
            <p className="mt-3 text-xs leading-6 text-slate-300 font-normal">{description}</p>
          </div>
        </footer>
      )}
    </div>
  );
}
