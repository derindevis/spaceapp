from fastapi import APIRouter, HTTPException, status
from app.services.nasa import epic
from app.services import iss
from app.services.nasa.client import NasaApiError

router = APIRouter()


@router.get("/earth-epic")
def read_earth_epic() -> dict[str, object]:
    try:
        images = epic.get_latest_epic_images()
        return {"data": images}
    except NasaApiError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc


@router.get("/iss-position")
def read_iss_position() -> dict[str, object]:
    try:
        position = iss.get_iss_position()
        return {"data": position}
    except iss.IssApiError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc


@router.get("/space-crew")
def read_space_crew() -> dict[str, object]:
    try:
        crew = iss.get_space_crew()
        return {"data": crew}
    except iss.IssApiError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc
