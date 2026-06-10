from datetime import date
from typing import Annotated
import json

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.notification import Notification
from app.schemas.space import NotificationRead
from app.services.nasa.client import NasaApiError
from app.services.nasa import space_weather
from app.services.ai import gemini
from app.services.ai.gemini import GeminiApiError
from app.core.websocket import manager
from app.core.config import settings

router = APIRouter()


def upstream_error(exc: NasaApiError) -> HTTPException:
    return HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc))


@router.get("/solar-flares")
def read_solar_flares(
    start_date: date | None = None,
    end_date: date | None = None,
) -> dict[str, object]:
    try:
        return {
            "data": space_weather.list_solar_flares(
                start_date=start_date,
                end_date=end_date,
            )
        }
    except NasaApiError:
        return {"data": [], "warning": "NASA space weather services are temporarily unavailable"}


@router.get("/cme")
def read_cme_events(
    start_date: date | None = None,
    end_date: date | None = None,
) -> dict[str, object]:
    try:
        return {
            "data": space_weather.list_cme_events(
                start_date=start_date,
                end_date=end_date,
            )
        }
    except NasaApiError:
        return {"data": [], "warning": "NASA space weather services are temporarily unavailable"}


@router.get("/storms")
def read_geomagnetic_storms(
    start_date: date | None = None,
    end_date: date | None = None,
) -> dict[str, object]:
    try:
        return {
            "data": space_weather.list_geomagnetic_storms(
                start_date=start_date,
                end_date=end_date,
            )
        }
    except NasaApiError:
        return {"data": [], "warning": "NASA space weather services are temporarily unavailable"}


@router.get("/alerts", response_model=dict[str, list[NotificationRead]])
async def read_weather_alerts(
    db: Annotated[Session, Depends(get_db)],
) -> dict[str, object]:
    from concurrent.futures import ThreadPoolExecutor
    try:
        with ThreadPoolExecutor(max_workers=3) as executor:
            future_flares = executor.submit(space_weather.list_solar_flares)
            future_cmes = executor.submit(space_weather.list_cme_events)
            future_storms = executor.submit(space_weather.list_geomagnetic_storms)
            
            flares = future_flares.result()
            cmes = future_cmes.result()
            storms = future_storms.result()
    except NasaApiError:
        flares, cmes, storms = [], [], []

    # Process Solar Flares
    for flr in flares:
        event_id = flr.get("flrID")
        if not event_id:
            continue
        existing = db.scalar(select(Notification).where(Notification.event_id == event_id))
        
        if existing is None:
            notification = Notification(
                event_id=event_id,
                event_type="FLR",
                start_time=flr.get("startTime") or "",
                details=json.dumps(flr),
                ai_explanation=None,
            )
            db.add(notification)
            db.commit()
            db.refresh(notification)

            await manager.broadcast({
                "type": "space_weather_alert",
                "data": {
                    "id": notification.id,
                    "event_id": event_id,
                    "event_type": "FLR",
                    "start_time": notification.start_time,
                    "ai_explanation": None,
                }
            })

    # Process CME Events
    for cme in cmes:
        event_id = cme.get("activityID")
        if not event_id:
            continue
        existing = db.scalar(select(Notification).where(Notification.event_id == event_id))
        
        if existing is None:
            notification = Notification(
                event_id=event_id,
                event_type="CME",
                start_time=cme.get("startTime") or "",
                details=json.dumps(cme),
                ai_explanation=None,
            )
            db.add(notification)
            db.commit()
            db.refresh(notification)

            await manager.broadcast({
                "type": "space_weather_alert",
                "data": {
                    "id": notification.id,
                    "event_id": event_id,
                    "event_type": "CME",
                    "start_time": notification.start_time,
                    "ai_explanation": None,
                }
            })

    # Process Geomagnetic Storms
    for storm in storms:
        event_id = storm.get("gstID")
        if not event_id:
            continue
        existing = db.scalar(select(Notification).where(Notification.event_id == event_id))
        
        if existing is None:
            notification = Notification(
                event_id=event_id,
                event_type="GST",
                start_time=storm.get("startTime") or "",
                details=json.dumps(storm),
                ai_explanation=None,
            )
            db.add(notification)
            db.commit()
            db.refresh(notification)

            await manager.broadcast({
                "type": "space_weather_alert",
                "data": {
                    "id": notification.id,
                    "event_id": event_id,
                    "event_type": "GST",
                    "start_time": notification.start_time,
                    "ai_explanation": None,
                }
            })

    alerts = db.scalars(
        select(Notification).order_by(Notification.start_time.desc())
    ).all()
    return {"data": list(alerts)}


@router.post("/alerts/{alert_id}/analyze", response_model=dict[str, NotificationRead])
def analyze_weather_alert(
    alert_id: int,
    db: Annotated[Session, Depends(get_db)],
) -> dict[str, object]:
    alert = db.get(Notification, alert_id)
    if alert is None:
        raise HTTPException(status_code=404, detail="Alert not found")

    if not alert.ai_explanation:
        if not settings.gemini_api_key:
            raise HTTPException(status_code=503, detail="Gemini API key is not configured")

        details_obj = json.loads(alert.details)
        if alert.event_type == "FLR":
            prompt = (
                f"Explain this Solar Flare space weather event to a general audience. "
                f"Class: {details_obj.get('classType')}, Peak Time: {details_obj.get('peakTime')}. "
                "What should a non-expert watch or care about?"
            )
        elif alert.event_type == "CME":
            prompt = (
                f"Explain this Coronal Mass Ejection (CME) space weather event to a general audience. "
                f"Activity ID: {alert.event_id}, Start Time: {details_obj.get('startTime')}. "
                "What are the potential impacts on satellites or power grids on Earth?"
            )
        else:  # GST
            prompt = (
                f"Explain this Geomagnetic Storm (GST) space weather event to a general audience. "
                f"Storm ID: {alert.event_id}, Start Time: {details_obj.get('startTime')}. "
                "What does this mean for aurora displays (Northern/Southern lights)?"
            )

        try:
            alert.ai_explanation = gemini._generate_text(prompt)
            db.commit()
            db.refresh(alert)
        except GeminiApiError as exc:
            raise HTTPException(status_code=502, detail=f"Gemini generation failed: {exc}") from exc

    return {"data": alert}
