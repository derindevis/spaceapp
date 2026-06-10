from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status, BackgroundTasks
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db, SessionLocal
from app.models.apod import ApodRecord
from app.schemas.space import ApodRecordRead
from app.services.nasa.client import NasaApiError
from app.services.nasa import apod
from app.services.ai import gemini
from app.services.ai.gemini import GeminiApiError
from app.core.config import settings

router = APIRouter()


def upstream_error(exc: NasaApiError) -> HTTPException:
    return HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc))


def generate_and_save_apod_summary(db_record_id: int, explanation: str) -> None:
    if not settings.gemini_api_key or not explanation:
        return
    try:
        ai_res = gemini.summarize_content(explanation)
        ai_summary = ai_res.get("summary")
        if ai_summary:
            with SessionLocal() as db:
                db_record = db.get(ApodRecord, db_record_id)
                if db_record:
                    db_record.ai_summary = ai_summary
                    db.commit()
    except Exception as exc:
        print(f"Background APOD summary generation failed: {exc}")


@router.get("/today", response_model=dict[str, ApodRecordRead])
def read_apod_today(
    db: Annotated[Session, Depends(get_db)],
    background_tasks: BackgroundTasks,
    target_date: date | None = Query(default=None, alias="date"),
) -> dict[str, object]:
    resolved_date = target_date or date.today()
    date_str = resolved_date.isoformat()

    # Check DB cache first using target date (if provided)
    if target_date:
        db_record = db.scalar(select(ApodRecord).where(ApodRecord.date == date_str))
        if db_record is not None:
            return {"data": db_record}

    # Fetch from NASA to see what date it resolved to
    try:
        apod_data = apod.get_apod_today(target_date=resolved_date)
    except NasaApiError as exc:
        raise upstream_error(exc) from exc

    actual_date_str = apod_data.get("date") or date_str

    # Check DB cache again using the actual resolved date from NASA
    db_record = db.scalar(select(ApodRecord).where(ApodRecord.date == actual_date_str))
    if db_record is not None:
        return {"data": db_record}

    # Save to DB immediately with ai_summary=None
    db_record = ApodRecord(
        date=actual_date_str,
        title=str(apod_data.get("title") or "NASA Astronomy Image"),
        explanation=str(apod_data.get("explanation") or ""),
        media_type=str(apod_data.get("media_type") or "image"),
        url=str(apod_data.get("url") or ""),
        hdurl=apod_data.get("hdurl"),
        ai_summary=None,
    )
    db.add(db_record)
    db.commit()
    db.refresh(db_record)

    # Queue summary generation in background
    explanation = apod_data.get("explanation")
    if settings.gemini_api_key and explanation:
        background_tasks.add_task(
            generate_and_save_apod_summary,
            db_record.id,
            explanation,
        )

    return {"data": db_record}


@router.get("/history")
def read_apod_history(
    start_date: date | None = None,
    end_date: date | None = None,
) -> dict[str, object]:
    try:
        return {"data": apod.get_apod_history(start_date=start_date, end_date=end_date)}
    except NasaApiError as exc:
        raise upstream_error(exc) from exc
