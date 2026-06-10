from datetime import date
from typing import Any

import httpx

from app.services.nasa.client import NasaApiError, nasa_get


def list_mars_photos(
    rover: str = "curiosity",
    sol: int | None = 1000,
    earth_date: date | None = None,
    camera: str | None = None,
    page: int = 1,
) -> list[dict[str, Any]]:
    params: dict[str, Any] = {"page": page}
    if earth_date:
        params["earth_date"] = earth_date.isoformat()
    elif sol is not None:
        params["sol"] = sol

    if camera:
        params["camera"] = camera.lower()

    try:
        data = nasa_get(f"/mars-photos/api/v1/rovers/{rover.lower()}/photos", params=params)
        return data.get("photos", [])
    except NasaApiError:
        return _fallback_image_search(rover=rover, page=page)


def _fallback_image_search(rover: str, page: int) -> list[dict[str, Any]]:
    query = f"Mars rover {rover}"

    try:
        response = httpx.get(
            "https://images-api.nasa.gov/search",
            params={
                "q": query,
                "media_type": "image",
                "page": page,
            },
            timeout=20.0,
        )
        response.raise_for_status()
    except httpx.HTTPError as exc:
        raise NasaApiError(f"NASA Images fallback request failed: {exc}") from exc

    items = response.json().get("collection", {}).get("items", [])
    return [_normalize_image_item(item, rover=rover) for item in items]


def _normalize_image_item(item: dict[str, Any], rover: str) -> dict[str, Any]:
    data = (item.get("data") or [{}])[0]
    links = item.get("links") or []
    image_link = next(
        (link.get("href") for link in links if link.get("render") == "image"),
        None,
    )

    return {
        "id": data.get("nasa_id"),
        "source": "nasa_images_fallback",
        "rover": rover.lower(),
        "title": data.get("title"),
        "description": data.get("description"),
        "earth_date": data.get("date_created"),
        "img_src": image_link,
        "href": item.get("href"),
    }
