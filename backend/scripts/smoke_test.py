from uuid import uuid4
from pathlib import Path
import sys

from fastapi.testclient import TestClient

sys.path.append(str(Path(__file__).resolve().parents[1]))

from app.api.routes import ai, apod, asteroids, mars, space_weather
from app.main import app


def patch_external_services() -> None:
    apod.apod.get_apod_today = lambda target_date=None: {"title": "Mock APOD"}
    apod.apod.get_apod_history = lambda start_date=None, end_date=None: [
        {"title": "Mock APOD History"}
    ]
    asteroids.asteroids.list_asteroids = lambda start_date=None, end_date=None: [
        {"name": "Mock NEO"}
    ]
    asteroids.asteroids.list_hazardous_asteroids = lambda start_date=None, end_date=None: [
        {"name": "Mock Hazard"}
    ]
    asteroids.asteroids.get_asteroid_stats = lambda start_date=None, end_date=None: {
        "total": 1,
        "hazardous": 1,
    }
    space_weather.space_weather.list_solar_flares = lambda start_date=None, end_date=None: [
        {"classType": "X1"}
    ]
    space_weather.space_weather.list_cme_events = lambda start_date=None, end_date=None: [
        {"activityID": "CME"}
    ]
    space_weather.space_weather.list_geomagnetic_storms = lambda start_date=None, end_date=None: [
        {"gstID": "GST"}
    ]
    mars.mars.list_mars_photos = lambda rover="curiosity", sol=1000, earth_date=None, camera=None, page=1: [
        {"id": "mock-mars"}
    ]
    ai.gemini.summarize_content = lambda content: {"summary": "ok"}
    ai.gemini.analyze_content = lambda content: {"analysis": "ok"}
    ai.gemini.chat_space = lambda history, message: {"reply": "ok"}
    
    from app.services.nasa import epic
    from app.services import iss
    epic.get_latest_epic_images = lambda: [{"identifier": "mock-epic", "image": "mock", "url": "mock", "date": "2026-06-10 12:00:00"}]
    iss.get_iss_position = lambda: {"latitude": 0.0, "longitude": 0.0, "timestamp": 0}
    iss.get_space_crew = lambda: [{"name": "Mock Astro", "craft": "ISS"}]

    from app.services.nasa import nasa_library
    from app.services import launch_tracker
    nasa_library.search_nasa_images = lambda q: [{"title": "Mock Image", "description": "Mock", "nasa_id": "mock", "date": "2026-06-10", "thumbnail_url": "mock", "high_res_url": "mock"}]
    launch_tracker.get_upcoming_launches = lambda: [{"id": "upcoming", "name": "Mock Launch", "status": "Go", "status_code": "Go", "date": "2026-06-10T00:00:00Z", "provider": "NASA", "rocket": "Falcon 9", "location": "KSC", "image": "mock", "description": "Mock", "orbit": "LEO"}]
    launch_tracker.get_past_launches = lambda: [{"id": "past", "name": "Mock Launch", "status": "Success", "status_code": "Success", "date": "2026-06-09T00:00:00Z", "provider": "NASA", "rocket": "Falcon 9", "location": "KSC", "image": "mock", "description": "Mock", "orbit": "LEO"}]


def main() -> None:
    patch_external_services()
    email = f"progress-{uuid4().hex[:8]}@example.com"
    password = "correct-horse-42"

    with TestClient(app) as client:
        checks: list[tuple[str, int]] = []
        checks.append(("health", client.get("/api/health").status_code))

        register = client.post(
            "/api/auth/register",
            json={"email": email, "password": password, "full_name": "Progress User"},
        )
        checks.append(("auth_register", register.status_code))

        login = client.post("/api/auth/login", json={"email": email, "password": password})
        checks.append(("auth_login", login.status_code))

        token = login.json()["access_token"]
        checks.append(
            (
                "auth_me",
                client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"}).status_code,
            )
        )
        checks.append(
            (
                "auth_duplicate",
                client.post("/api/auth/register", json={"email": email, "password": password}).status_code,
            )
        )

        get_paths = [
            ("apod_today", "/api/apod/today"),
            ("apod_history", "/api/apod/history"),
            ("asteroids", "/api/asteroids"),
            ("asteroids_hazardous", "/api/asteroids/hazardous"),
            ("asteroids_stats", "/api/asteroids/stats"),
            ("weather_flares", "/api/weather/solar-flares"),
            ("weather_cme", "/api/weather/cme"),
            ("weather_storms", "/api/weather/storms"),
            ("mars_photos", "/api/mars/photos"),
            ("explorer_epic", "/api/explorer/earth-epic"),
            ("explorer_iss", "/api/explorer/iss-position"),
            ("explorer_crew", "/api/explorer/space-crew"),
            ("library_search", "/api/library/search?q=sun"),
            ("library_launches", "/api/library/launches"),
        ]
        for name, path in get_paths:
            checks.append((name, client.get(path).status_code))

        checks.append(
            ("ai_summarize", client.post("/api/ai/summarize", json={"content": "hello"}).status_code)
        )
        checks.append(("ai_analyze", client.post("/api/ai/analyze", json={"content": "hello"}).status_code))
        checks.append(
            ("ai_chat", client.post("/api/ai/chat", json={"message": "hello", "history": []}).status_code)
        )

    failed = [(name, status) for name, status in checks if status >= 400 and name != "auth_duplicate"]
    for name, status in checks:
        print(f"{name} {status}")

    if failed:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
