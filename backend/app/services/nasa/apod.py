from datetime import date, timedelta
from typing import Any

import httpx

from app.services.nasa.client import NasaApiError, nasa_get


def get_apod_today(target_date: date | None = None) -> dict[str, object]:
    params = {"thumbs": True}
    if target_date:
        params["date"] = target_date.isoformat()

    try:
        return nasa_get("/planetary/apod", params=params)
    except NasaApiError:
        if target_date:
            raise

        return _fallback_apod_image()


def get_apod_history(
    start_date: date | None = None,
    end_date: date | None = None,
) -> list[dict[str, object]]:
    resolved_end = end_date or date.today()
    resolved_start = start_date or resolved_end - timedelta(days=6)

    try:
        data = nasa_get(
            "/planetary/apod",
            params={
                "start_date": resolved_start.isoformat(),
                "end_date": resolved_end.isoformat(),
                "thumbs": True,
            },
        )
    except NasaApiError:
        return [_fallback_apod_image()]

    if isinstance(data, list):
        return data

    return [data]


def _fallback_apod_image() -> dict[str, object]:
    try:
        response = httpx.get(
            "https://images-api.nasa.gov/search",
            params={"q": "astronomy picture of the day", "media_type": "image", "page": 1},
            timeout=20.0,
        )
        response.raise_for_status()
    except httpx.HTTPError as exc:
        raise NasaApiError(f"NASA APOD fallback request failed: {exc}") from exc

    items = response.json().get("collection", {}).get("items", [])
    if not items:
        raise NasaApiError("NASA APOD fallback did not return images")

    return _normalize_image_item(items[0])


def _normalize_image_item(item: dict[str, Any]) -> dict[str, object]:
    data = (item.get("data") or [{}])[0]
    links = item.get("links") or []
    image_link = next(
        (link.get("href") for link in links if link.get("render") == "image"),
        None,
    )

    return {
        "title": data.get("title") or "NASA Astronomy Image",
        "explanation": data.get("description")
        or "NASA APOD was temporarily unavailable, so this image came from NASA Images.",
        "date": (data.get("date_created") or "")[:10],
        "media_type": "image",
        "url": image_link,
        "source": "nasa_images_fallback",
    }
