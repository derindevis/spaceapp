from fastapi import APIRouter, Query
from app.services.nasa import nasa_library
from app.services import launch_tracker

router = APIRouter()

@router.get("/search")
def search_library(q: str = Query(min_length=1)) -> dict[str, object]:
    from fastapi import HTTPException, status
    try:
        results = nasa_library.search_nasa_images(q)
        return {"data": results}
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"NASA Image Archive is temporarily unreachable: {exc}"
        )

@router.get("/launches")
def get_launches() -> dict[str, object]:
    upcoming = launch_tracker.get_upcoming_launches()
    past = launch_tracker.get_past_launches()
    return {
        "data": {
            "upcoming": upcoming,
            "past": past
        }
    }
