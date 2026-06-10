import time
from fastapi import Request, Response, status
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, limit: int = 60, window: int = 60) -> None:
        super().__init__(app)
        self.limit = limit
        self.window = window
        self.requests: dict[str, list[float]] = {}

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        # Avoid rate limiting websockets directly since they establish persistent connections
        if request.scope.get("type") == "websocket":
            return await call_next(request)

        # Skip rate limit for local tests/health check if needed, but general rate limiting is fine
        if request.url.path == "/api/health":
            return await call_next(request)

        client_ip = request.client.host if request.client else "unknown"
        now = time.time()

        # Get request timestamps for client
        timestamps = self.requests.get(client_ip, [])
        # Filter out requests older than the sliding window
        timestamps = [t for t in timestamps if now - t < self.window]

        if len(timestamps) >= self.limit:
            return Response(
                content='{"detail": "Too Many Requests. Rate limit exceeded (60 requests/min)."}',
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                media_type="application/json",
            )

        timestamps.append(now)
        self.requests[client_ip] = timestamps

        return await call_next(request)
