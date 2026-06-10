from typing import Any

import httpx

from app.core.config import settings

GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta"
GEMINI_TIMEOUT_SECONDS = 30.0
GEMINI_RETRY_ATTEMPTS = 2


class GeminiApiError(RuntimeError):
    pass


def summarize_content(content: str) -> dict[str, str]:
    prompt = (
        "Summarize this space or astronomy content for a general audience. "
        "Return a concise summary and 3 key points.\n\n"
        f"{content}"
    )
    text = _generate_text(prompt)
    return {"summary": text}


def analyze_content(content: str) -> dict[str, str]:
    prompt = (
        "Analyze this NASA or space-observability content. Explain hazard level, "
        "important signals, and what a non-expert should watch next.\n\n"
        f"{content}"
    )
    text = _generate_text(prompt)
    return {"analysis": text}


def chat_space(history: list[dict[str, str]], message: str) -> dict[str, str]:
    formatted_contents = []
    for h in history:
        role = "user" if h.get("role") == "user" else "model"
        formatted_contents.append({
            "role": role,
            "parts": [{"text": h.get("content", "")}]
        })
    formatted_contents.append({
        "role": "user",
        "parts": [{"text": message}]
    })
    payload = {
        "contents": formatted_contents,
        "systemInstruction": {
            "parts": [{"text": "You are a Mission Specialist Space Tutor. Your goal is to help students study and learn space-related knowledge, telemetry, astronomy, and astronautics. Keep your answers engaging, educational, and formatting clean using Markdown."}]
        }
    }
    text = _generate_payload(payload)
    return {"reply": text}


def _generate_text(prompt: str) -> str:
    payload = {"contents": [{"parts": [{"text": prompt}]}]}
    return _generate_payload(payload)


def _generate_payload(payload: dict[str, Any]) -> str:
    if not settings.gemini_api_key:
        raise GeminiApiError("GEMINI_API_KEY is not configured")

    last_error: GeminiApiError | None = None

    for model in _model_candidates():
        url = f"{GEMINI_BASE_URL}/models/{model}:generateContent"
        for _ in range(GEMINI_RETRY_ATTEMPTS):
            try:
                response = httpx.post(
                    url,
                    headers={
                        "Content-Type": "application/json",
                        "x-goog-api-key": settings.gemini_api_key,
                    },
                    json=payload,
                    timeout=GEMINI_TIMEOUT_SECONDS,
                )
                response.raise_for_status()
                return _extract_text(response.json())
            except httpx.HTTPStatusError as exc:
                detail = _extract_error_detail(exc.response)
                last_error = GeminiApiError(f"Gemini API error for {model}: {detail}")
                if exc.response.status_code not in {429, 500, 502, 503, 504}:
                    raise last_error from exc
            except httpx.HTTPError as exc:
                last_error = GeminiApiError(f"Gemini API request failed for {model}: {exc}")

    raise last_error or GeminiApiError("Gemini API request failed")


def _model_candidates() -> list[str]:
    models = [settings.gemini_model]
    models.extend(
        model.strip()
        for model in settings.gemini_fallback_models.split(",")
        if model.strip()
    )

    unique_models: list[str] = []
    for model in models:
        if model not in unique_models:
            unique_models.append(model)

    return unique_models


def _extract_text(body: dict[str, Any]) -> str:
    candidates = body.get("candidates") or []
    if not candidates:
        raise GeminiApiError("Gemini response did not include candidates")

    parts = candidates[0].get("content", {}).get("parts") or []
    text = "".join(part.get("text", "") for part in parts)
    if not text:
        raise GeminiApiError("Gemini response did not include text")

    return text


def _extract_error_detail(response: httpx.Response) -> str:
    try:
        body = response.json()
    except ValueError:
        return response.text or response.reason_phrase

    if isinstance(body, dict):
        error = body.get("error")
        if isinstance(error, dict):
            return str(error.get("message") or error)
        return str(body.get("message") or body)

    return str(body)
