from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.core.config import settings
from app.core.ratelimit import RateLimitMiddleware
from app.db.session import init_db


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    init_db()
    yield


def create_app() -> FastAPI:
    app = FastAPI(title=settings.app_name, lifespan=lifespan)

    # Build allowed origins list: primary origin + any extras + localhost dev
    allowed_origins: list[str] = [settings.frontend_origin, "http://localhost:5173"]
    if settings.frontend_origins:
        for o in settings.frontend_origins.split(","):
            o = o.strip()
            if o:
                allowed_origins.append(o)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        # Also allow any Vercel preview/branch deployment automatically
        allow_origin_regex=r"https://spaceapp.*\.vercel\.app",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.add_middleware(RateLimitMiddleware, limit=60, window=60)

    app.include_router(api_router, prefix="/api")

    return app


app = create_app()
