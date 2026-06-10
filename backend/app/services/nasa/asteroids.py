from datetime import date, timedelta
from typing import Any

from app.services.nasa.client import nasa_get


def list_asteroids(
    start_date: date | None = None,
    end_date: date | None = None,
) -> list[dict[str, Any]]:
    return _fetch_asteroids(start_date=start_date, end_date=end_date)


def list_hazardous_asteroids(
    start_date: date | None = None,
    end_date: date | None = None,
) -> list[dict[str, Any]]:
    return [
        asteroid
        for asteroid in _fetch_asteroids(start_date=start_date, end_date=end_date)
        if asteroid["is_potentially_hazardous"]
    ]


def get_asteroid_stats(
    start_date: date | None = None,
    end_date: date | None = None,
) -> dict[str, Any]:
    asteroids = _fetch_asteroids(start_date=start_date, end_date=end_date)
    hazardous_count = sum(1 for asteroid in asteroids if asteroid["is_potentially_hazardous"])
    closest = min(
        asteroids,
        key=lambda asteroid: asteroid.get("miss_distance_km") or float("inf"),
        default=None,
    )
    largest = max(
        asteroids,
        key=lambda asteroid: asteroid.get("estimated_diameter_max_m") or 0,
        default=None,
    )

    return {
        "total": len(asteroids),
        "hazardous": hazardous_count,
        "non_hazardous": len(asteroids) - hazardous_count,
        "closest": closest,
        "largest": largest,
    }


def _fetch_asteroids(
    start_date: date | None = None,
    end_date: date | None = None,
) -> list[dict[str, Any]]:
    resolved_start = start_date or date.today()
    resolved_end = end_date or resolved_start + timedelta(days=1)
    if (resolved_end - resolved_start).days > 7:
        resolved_end = resolved_start + timedelta(days=7)

    data = nasa_get(
        "/neo/rest/v1/feed",
        params={
            "start_date": resolved_start.isoformat(),
            "end_date": resolved_end.isoformat(),
        },
    )
    objects_by_date = data.get("near_earth_objects", {})

    normalized: list[dict[str, Any]] = []
    for close_approach_date, objects in objects_by_date.items():
        for item in objects:
            approach = (item.get("close_approach_data") or [{}])[0]
            miss_distance = approach.get("miss_distance") or {}
            relative_velocity = approach.get("relative_velocity") or {}
            diameter = item.get("estimated_diameter", {}).get("meters", {})

            normalized.append(
                {
                    "id": item.get("id"),
                    "name": item.get("name"),
                    "nasa_jpl_url": item.get("nasa_jpl_url"),
                    "absolute_magnitude_h": item.get("absolute_magnitude_h"),
                    "estimated_diameter_min_m": diameter.get("estimated_diameter_min"),
                    "estimated_diameter_max_m": diameter.get("estimated_diameter_max"),
                    "is_potentially_hazardous": item.get(
                        "is_potentially_hazardous_asteroid",
                        False,
                    ),
                    "close_approach_date": approach.get("close_approach_date")
                    or close_approach_date,
                    "orbiting_body": approach.get("orbiting_body"),
                    "miss_distance_km": _to_float(miss_distance.get("kilometers")),
                    "relative_velocity_kph": _to_float(
                        relative_velocity.get("kilometers_per_hour")
                    ),
                }
            )

    return sorted(normalized, key=lambda asteroid: asteroid["close_approach_date"])


def _to_float(value: object) -> float | None:
    try:
        return float(value) if value is not None else None
    except (TypeError, ValueError):
        return None
