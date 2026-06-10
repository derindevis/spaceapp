from typing import Any
from time import monotonic
import httpx

NASA_IMAGES_API_URL = "https://images-api.nasa.gov/search"
CACHE_TTL_SECONDS = 600.0  # 10 minutes cache

_cache: dict[str, tuple[float, list[dict[str, Any]]]] = {}

def search_nasa_images(query: str) -> list[dict[str, Any]]:
    query_key = query.strip().lower()
    
    # Check cache
    cached = _cache.get(query_key)
    if cached and monotonic() - cached[0] < CACHE_TTL_SECONDS:
        return cached[1]
        
    try:
        response = httpx.get(
            NASA_IMAGES_API_URL,
            params={"q": query, "media_type": "image"},
            timeout=5.0
        )
        response.raise_for_status()
        data = response.json()
        
        items = data.get("collection", {}).get("items", [])
        normalized = []
        for item in items[:40]:  # Limit to top 40 images
            data_list = item.get("data", [])
            links_list = item.get("links", [])
            if not data_list or not links_list:
                continue
            
            info = data_list[0]
            link = links_list[0]
            
            thumb_url = link.get("href")
            if not thumb_url:
                continue
                
            # Map thumbnail to high-res preview URL (e.g., ~thumb.jpg -> ~large.jpg)
            high_res_url = thumb_url
            if "~thumb." in thumb_url:
                ext = thumb_url.split(".")[-1]
                high_res_url = thumb_url.replace(f"~thumb.{ext}", f"~large.{ext}")
            
            normalized.append({
                "title": info.get("title", "Space Image"),
                "description": info.get("description", "NASA archival space image."),
                "nasa_id": info.get("nasa_id", ""),
                "date": info.get("date_created", "").split("T")[0] if info.get("date_created") else "",
                "thumbnail_url": thumb_url,
                "high_res_url": high_res_url,
            })
        
        # Store in cache
        _cache[query_key] = (monotonic(), normalized)
        return normalized
    except Exception as exc:
        print(f"Failed to query NASA Image Library API: {exc}")
        # If we have expired cache, return it rather than failing completely
        if query_key in _cache:
            return _cache[query_key][1]
        raise RuntimeError(str(exc)) from exc
