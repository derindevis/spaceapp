from typing import Any
import httpx


class IssApiError(RuntimeError):
    pass


def get_iss_position() -> dict[str, float]:
    try:
        response = httpx.get(
            "https://api.wheretheiss.at/v1/satellites/25544",
            headers={"User-Agent": "Mozilla/5.0"},
            timeout=15.0
        )
        response.raise_for_status()
        data = response.json()
        
        return {
            "latitude": float(data.get("latitude", 0.0)),
            "longitude": float(data.get("longitude", 0.0)),
            "timestamp": data.get("timestamp", 0),
        }
    except Exception as exc:
        raise IssApiError(f"Failed to fetch ISS position: {exc}") from exc


def get_space_crew() -> list[dict[str, str]]:
    try:
        response = httpx.get(
            "https://corquaid.github.io/international-space-station-APIs/JSON/people-in-space.json",
            headers={"User-Agent": "Mozilla/5.0"},
            timeout=15.0
        )
        response.raise_for_status()
        data = response.json()
        
        people = data.get("people", [])
        return [
            {
                "name": person.get("name", "Unknown Astronaut"),
                "craft": person.get("spacecraft") or person.get("craft", "ISS"),
            }
            for person in people
        ]
    except Exception as exc:
        raise IssApiError(f"Failed to fetch space crew: {exc}") from exc
