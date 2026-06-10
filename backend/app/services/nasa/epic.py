from typing import Any
from app.services.nasa.client import nasa_get


def get_latest_epic_images() -> list[dict[str, Any]]:
    # Fetch natural color images metadata
    data = nasa_get("/EPIC/api/natural")
    if not isinstance(data, list):
        return []

    normalized = []
    for item in data[:8]:  # Limit to the latest 8 images
        image_name = item.get("image")
        date_str = item.get("date")  # Format: "YYYY-MM-DD HH:MM:SS"
        
        if not image_name or not date_str:
            continue
            
        # Parse date components to construct image URL
        # e.g., "2026-06-10 12:00:00" -> year="2026", month="06", day="10"
        date_part = date_str.split(" ")[0]
        year, month, day = date_part.split("-")
        
        image_url = f"https://epic.gsfc.nasa.gov/archive/natural/{year}/{month}/{day}/png/{image_name}.png"
        
        normalized.append({
            "identifier": item.get("identifier"),
            "image": image_name,
            "url": image_url,
            "date": date_str,
            "caption": item.get("caption", "Natural color image of Earth"),
            "coords": item.get("centroid_coordinates", {}),
        })
        
    return normalized
