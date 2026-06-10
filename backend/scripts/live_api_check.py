from pathlib import Path
import sys

from fastapi.testclient import TestClient

sys.path.append(str(Path(__file__).resolve().parents[1]))

from app.core.config import settings
from app.main import app


def describe_payload(payload: object) -> str:
    if isinstance(payload, list):
        return f"{len(payload)} items"
    if isinstance(payload, dict):
        return f"fields: {', '.join(list(payload.keys())[:5])}"
    return str(type(payload).__name__)


def main() -> None:
    print(f"NASA_API_KEY_SET {bool(settings.nasa_api_key and settings.nasa_api_key != 'DEMO_KEY')}")
    print(f"GEMINI_API_KEY_SET {bool(settings.gemini_api_key)}")
    print(f"GEMINI_MODEL {settings.gemini_model}")

    with TestClient(app) as client:
        get_checks = [
            ("apod", "/api/apod/today"),
            ("asteroids_stats", "/api/asteroids/stats"),
            ("weather_flares", "/api/weather/solar-flares"),
            ("mars", "/api/mars/photos?rover=curiosity&sol=1000&page=1"),
            ("explorer_epic", "/api/explorer/earth-epic"),
            ("explorer_iss", "/api/explorer/iss-position"),
            ("explorer_crew", "/api/explorer/space-crew"),
        ]

        for name, path in get_checks:
            response = client.get(path)
            body = response.json()
            if response.status_code >= 400:
                print(f"{name} {response.status_code} {body.get('detail')}")
            else:
                print(f"{name} {response.status_code} {describe_payload(body.get('data'))}")

        response = client.post(
            "/api/ai/summarize",
            json={"content": "NASA reported a moderate solar flare and elevated geomagnetic activity."},
        )
        body = response.json()
        if response.status_code >= 400:
            print(f"gemini {response.status_code} {body.get('detail')}")
        else:
            data = body.get("data", {})
            summary = data.get("summary", "") if isinstance(data, dict) else ""
            print(f"gemini {response.status_code} {summary[:120].replace(chr(10), ' ')}")


if __name__ == "__main__":
    main()

