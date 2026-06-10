from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, delete
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.models.mars import SavedMarsPhoto
from app.schemas.space import SavedMarsPhotoCreate, SavedMarsPhotoRead
from app.services.nasa.client import NasaApiError
from app.services.nasa import mars

router = APIRouter()


def upstream_error(exc: NasaApiError) -> HTTPException:
    return HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc))


@router.get("/photos")
def read_mars_photos(
    rover: str = Query(default="curiosity", pattern="^(curiosity|opportunity|spirit|perseverance)$"),
    sol: int | None = Query(default=1000, ge=0),
    earth_date: date | None = None,
    camera: str | None = None,
    page: int = Query(default=1, ge=1),
) -> dict[str, object]:
    try:
        return {
            "data": mars.list_mars_photos(
                rover=rover,
                sol=sol,
                earth_date=earth_date,
                camera=camera,
                page=page,
            )
        }
    except NasaApiError as exc:
        raise upstream_error(exc) from exc


@router.post("/saved", response_model=dict[str, SavedMarsPhotoRead], status_code=status.HTTP_201_CREATED)
def save_photo(
    payload: SavedMarsPhotoCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> dict[str, object]:
    # Check if already bookmarked by the user
    existing = db.scalar(
        select(SavedMarsPhoto).where(
            SavedMarsPhoto.user_id == current_user.id,
            SavedMarsPhoto.photo_id == payload.photo_id,
        )
    )
    if existing is not None:
        return {"data": existing}

    saved_photo = SavedMarsPhoto(
        user_id=current_user.id,
        photo_id=payload.photo_id,
        title=payload.title,
        img_src=payload.img_src,
        earth_date=payload.earth_date,
        rover=payload.rover,
        camera=payload.camera,
    )
    db.add(saved_photo)
    db.commit()
    db.refresh(saved_photo)

    return {"data": saved_photo}


@router.get("/saved", response_model=dict[str, list[SavedMarsPhotoRead]])
def list_saved_photos(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> dict[str, object]:
    photos = db.scalars(
        select(SavedMarsPhoto).where(SavedMarsPhoto.user_id == current_user.id)
    ).all()
    return {"data": list(photos)}


@router.delete("/saved/{photo_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_saved_photo(
    photo_id: str,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> None:
    db.execute(
        delete(SavedMarsPhoto).where(
            SavedMarsPhoto.user_id == current_user.id,
            SavedMarsPhoto.photo_id == photo_id,
        )
    )
    db.commit()

