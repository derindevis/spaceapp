from datetime import date, timedelta
from typing import Any

from app.services.nasa.client import nasa_get


def list_solar_flares(
    start_date: date | None = None,
    end_date: date | None = None,
) -> list[dict[str, Any]]:
    return _donki_get("/DONKI/FLR", start_date=start_date, end_date=end_date)


def list_cme_events(
    start_date: date | None = None,
    end_date: date | None = None,
) -> list[dict[str, Any]]:
    return _donki_get("/DONKI/CME", start_date=start_date, end_date=end_date)


def list_geomagnetic_storms(
    start_date: date | None = None,
    end_date: date | None = None,
) -> list[dict[str, Any]]:
    return _donki_get("/DONKI/GST", start_date=start_date, end_date=end_date)


def _donki_get(
    path: str,
    start_date: date | None = None,
    end_date: date | None = None,
) -> list[dict[str, Any]]:
    resolved_end = end_date or date.today()
    resolved_start = start_date or resolved_end - timedelta(days=7)
    data = nasa_get(
        path,
        params={
            "startDate": resolved_start.isoformat(),
            "endDate": resolved_end.isoformat(),
        },
    )

    if isinstance(data, list):
        return data

    return [data]
