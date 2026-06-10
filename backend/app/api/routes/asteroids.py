from datetime import date

from fastapi import APIRouter, HTTPException, status

from app.services.nasa.client import NasaApiError
from app.services.nasa import asteroids

router = APIRouter()


def upstream_error(exc: NasaApiError) -> HTTPException:
    return HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc))


@router.get("")
def read_asteroids(
    start_date: date | None = None,
    end_date: date | None = None,
) -> dict[str, object]:
    try:
        return {"data": asteroids.list_asteroids(start_date=start_date, end_date=end_date)}
    except NasaApiError as exc:
        raise upstream_error(exc) from exc


@router.get("/hazardous")
def read_hazardous_asteroids(
    start_date: date | None = None,
    end_date: date | None = None,
) -> dict[str, object]:
    try:
        return {
            "data": asteroids.list_hazardous_asteroids(
                start_date=start_date,
                end_date=end_date,
            )
        }
    except NasaApiError as exc:
        raise upstream_error(exc) from exc


@router.get("/stats")
def read_asteroid_stats(
    start_date: date | None = None,
    end_date: date | None = None,
) -> dict[str, object]:
    try:
        return {"data": asteroids.get_asteroid_stats(start_date=start_date, end_date=end_date)}
    except NasaApiError as exc:
        raise upstream_error(exc) from exc
