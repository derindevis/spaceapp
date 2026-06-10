from typing import Any
import httpx

LAUNCH_LIBRARY_BASE_URL = "https://lldev.thespacedevs.com/2.2.0"

def get_upcoming_launches() -> list[dict[str, Any]]:
    try:
        response = httpx.get(
            f"{LAUNCH_LIBRARY_BASE_URL}/launch/upcoming/",
            params={"limit": 15},
            timeout=15.0
        )
        response.raise_for_status()
        data = response.json()
        return _normalize_launches(data.get("results", []))
    except Exception as exc:
        print(f"Failed to fetch upcoming launches: {exc}")
        return []

def get_past_launches() -> list[dict[str, Any]]:
    try:
        response = httpx.get(
            f"{LAUNCH_LIBRARY_BASE_URL}/launch/previous/",
            params={"limit": 15},
            timeout=15.0
        )
        response.raise_for_status()
        data = response.json()
        return _normalize_launches(data.get("results", []))
    except Exception as exc:
        print(f"Failed to fetch past launches: {exc}")
        return []

def _normalize_launches(results: list[dict[str, Any]]) -> list[dict[str, Any]]:
    normalized = []
    for item in results:
        mission = item.get("mission") or {}
        normalized.append({
            "id": item.get("id", ""),
            "name": item.get("name", "Space Launch"),
            "status": item.get("status", {}).get("name", "Unknown"),
            "status_code": item.get("status", {}).get("abbrev", "TBD"),
            "date": item.get("net", ""),
            "provider": item.get("launch_service_provider", {}).get("name", "Unknown Agency"),
            "rocket": item.get("rocket", {}).get("configuration", {}).get("name", "Rocket"),
            "location": item.get("pad", {}).get("location", {}).get("name", "Launch Pad"),
            "image": item.get("image", ""),
            "description": mission.get("description", "No mission description available."),
            "orbit": mission.get("orbit", {}).get("name", "Low Earth Orbit") if mission.get("orbit") else "Orbit",
        })
    return normalized
