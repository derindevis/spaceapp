from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class ApodRecordRead(BaseModel):
    id: int
    date: str
    title: str
    explanation: str
    media_type: str
    url: str
    hdurl: str | None
    ai_summary: str | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SavedMarsPhotoCreate(BaseModel):
    photo_id: str = Field(min_length=1, max_length=50)
    title: str | None = Field(default=None, max_length=255)
    img_src: str = Field(min_length=1, max_length=500)
    earth_date: str = Field(min_length=1, max_length=10)
    rover: str = Field(min_length=1, max_length=50)
    camera: str = Field(min_length=1, max_length=50)


class SavedMarsPhotoRead(BaseModel):
    id: int
    user_id: str
    photo_id: str
    title: str | None
    img_src: str
    earth_date: str
    rover: str
    camera: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class NotificationRead(BaseModel):
    id: int
    event_id: str
    event_type: str
    start_time: str
    details: str
    ai_explanation: str | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
