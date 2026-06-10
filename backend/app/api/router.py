from fastapi import APIRouter

from app.api.routes import ai, apod, asteroids, auth, health, mars, space_weather, websocket, space_explorer, space_library

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(health.router, tags=["health"])
api_router.include_router(apod.router, prefix="/apod", tags=["apod"])
api_router.include_router(asteroids.router, prefix="/asteroids", tags=["asteroids"])
api_router.include_router(space_weather.router, prefix="/weather", tags=["space weather"])
api_router.include_router(mars.router, prefix="/mars", tags=["mars"])
api_router.include_router(ai.router, prefix="/ai", tags=["ai"])
api_router.include_router(websocket.router, prefix="/ws", tags=["websocket"])
api_router.include_router(space_explorer.router, prefix="/explorer", tags=["space explorer"])
api_router.include_router(space_library.router, prefix="/library", tags=["space library"])
