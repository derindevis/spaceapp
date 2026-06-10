from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from app.services.ai.gemini import GeminiApiError
from app.services.ai import gemini

router = APIRouter()


class AiRequest(BaseModel):
    content: str = Field(min_length=1)


class ChatMessage(BaseModel):
    role: str = Field(pattern="^(user|assistant)$")
    content: str = Field(min_length=1)


class ChatRequest(BaseModel):
    history: list[ChatMessage] = Field(default_factory=list)
    message: str = Field(min_length=1)


def ai_error(exc: GeminiApiError) -> HTTPException:
    status_code = (
        status.HTTP_503_SERVICE_UNAVAILABLE
        if "not configured" in str(exc)
        else status.HTTP_502_BAD_GATEWAY
    )
    return HTTPException(status_code=status_code, detail=str(exc))


@router.post("/summarize")
def summarize(payload: AiRequest) -> dict[str, object]:
    try:
        return {"data": gemini.summarize_content(payload.content)}
    except GeminiApiError as exc:
        raise ai_error(exc) from exc


@router.post("/analyze")
def analyze(payload: AiRequest) -> dict[str, object]:
    try:
        return {"data": gemini.analyze_content(payload.content)}
    except GeminiApiError as exc:
        raise ai_error(exc) from exc


@router.post("/chat")
def chat(payload: ChatRequest) -> dict[str, object]:
    try:
        history_list = [msg.model_dump() for msg in payload.history]
        return {"data": gemini.chat_space(history_list, payload.message)}
    except GeminiApiError as exc:
        raise ai_error(exc) from exc
