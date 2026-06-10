from typing import Any
from time import monotonic

import httpx

from app.core.config import settings

NASA_BASE_URL = "https://api.nasa.gov"
NASA_TIMEOUT_SECONDS = 4.0
NASA_RETRY_ATTEMPTS = 1
NASA_CACHE_TTL_SECONDS = 300.0

_cache: dict[tuple[str, tuple[tuple[str, str], ...]], tuple[float, Any]] = {}


class NasaApiError(RuntimeError):
    pass


def nasa_get(path: str, params: dict[str, Any] | None = None) -> Any:
    request_params = {"api_key": settings.nasa_api_key}
    if params:
        request_params.update({key: value for key, value in params.items() if value is not None})

    cache_key = _cache_key(path, request_params)
    cached = _cache.get(cache_key)
    if cached and monotonic() - cached[0] < NASA_CACHE_TTL_SECONDS:
        return cached[1]

    last_error: httpx.HTTPError | None = None
    for _ in range(NASA_RETRY_ATTEMPTS):
        try:
            response = httpx.get(
                f"{NASA_BASE_URL}{path}",
                params=request_params,
                timeout=NASA_TIMEOUT_SECONDS,
                follow_redirects=True,
            )
            response.raise_for_status()
            data = response.json()
            _cache[cache_key] = (monotonic(), data)
            return data
        except httpx.HTTPStatusError as exc:
            detail = _extract_error_detail(exc.response)
            raise NasaApiError(f"NASA API error: {detail}") from exc
        except httpx.HTTPError as exc:
            last_error = exc

    raise NasaApiError(f"NASA API request failed: {last_error}") from last_error


def _cache_key(path: str, params: dict[str, Any]) -> tuple[str, tuple[tuple[str, str], ...]]:
    return path, tuple(sorted((key, str(value)) for key, value in params.items()))


def _extract_error_detail(response: httpx.Response) -> str:
    try:
        body = response.json()
    except ValueError:
        return response.text or response.reason_phrase

    if isinstance(body, dict):
        return str(body.get("msg") or body.get("message") or body.get("error") or body)

    return str(body)
