# AI-Powered Space Intelligence Platform

Full-stack realtime web application for NASA space data, AI summaries, dashboards, and alerting.

## Stack

- Frontend: React, TypeScript, Vite, Tailwind CSS
- Backend: FastAPI, SQLAlchemy, Pydantic, WebSockets
- Database: Supabase PostgreSQL
- AI: Google Gemini API
- Data: NASA APOD, NeoWs, DONKI, Mars Rover Photos

## Project Structure

```text
space-platform/
  frontend/
  backend/
  docker/
  docs/
  scripts/
```

## First Milestone

The first milestone is a vertical slice:

1. Backend health route
2. Frontend app shell
3. Auth scaffolding
4. APOD integration
5. AI summary for APOD
6. Dashboard card consuming the backend

## Backend Routes

- `GET /api/health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/apod/today`
- `GET /api/apod/history`
- `GET /api/asteroids`
- `GET /api/asteroids/hazardous`
- `GET /api/asteroids/stats`
- `GET /api/weather/solar-flares`
- `GET /api/weather/cme`
- `GET /api/weather/storms`
- `GET /api/mars/photos`
- `POST /api/ai/summarize`
- `POST /api/ai/analyze`

NASA routes are implemented with `httpx` service clients. Gemini routes are also
implemented, but they return `503` until `GEMINI_API_KEY` is configured.

The Mars route first tries NASA's archived Mars Rover Photos endpoint. If that
endpoint is unavailable, it falls back to NASA Images search and returns Mars
rover imagery with `source: "nasa_images_fallback"`.

## Frontend Routes

- `/` public project entry page
- `/login` login form
- `/register` registration form
- `/dashboard` protected dashboard

The frontend stores the JWT access token in `localStorage` under
`space-platform-token`. The auth provider validates an existing token by calling
`GET /api/auth/me` when the app loads.

## Local Development

Install dependencies inside the project only. Python packages should live in the
backend virtual environment at `backend/.venv`, and frontend packages should live
in `frontend/node_modules`. Do not install project dependencies globally.

Frontend:

```powershell
cd frontend
npm.cmd install
npm.cmd run dev
```

Backend:

```powershell
cd backend
uv venv .venv
uv pip install -r requirements.txt
uv run fastapi dev app/main.py
```

The backend defaults to a local SQLite database for development. Set `DATABASE_URL`
to your Supabase PostgreSQL connection string when you are ready to connect the
production database.

## Environment Setup

Do not commit real secrets. Copy the example files and update the copied `.env`
files locally or in your hosting provider dashboards.

Backend:

```powershell
cd backend
Copy-Item .env.example .env
```

Frontend:

```powershell
cd frontend
Copy-Item .env.example .env
```

## Where To Add API Keys

Update backend API keys in `backend/.env`:

```env
NASA_API_KEY="your-nasa-api-key"
GEMINI_API_KEY="your-gemini-api-key"
GEMINI_MODEL="gemini-3.5-flash"
GEMINI_FALLBACK_MODELS=""
```

The backend reads these values from `backend/app/core/config.py` as:

- `settings.nasa_api_key`
- `settings.gemini_api_key`

NASA and Gemini services read settings like this:

```python
from app.core.config import settings

nasa_api_key = settings.nasa_api_key
gemini_api_key = settings.gemini_api_key
```

Current service locations:

- NASA clients: `backend/app/services/nasa/`
- Gemini client: `backend/app/services/ai/gemini.py`
- API routes: `backend/app/api/routes/`

Implemented service files:

```text
backend/app/services/nasa/apod.py
backend/app/services/nasa/asteroids.py
backend/app/services/nasa/space_weather.py
backend/app/services/nasa/mars.py
backend/app/services/ai/gemini.py
```

Update those files first when you want to adjust API behavior. The route files
are already connected in `backend/app/api/router.py`.

Example pattern:

```python
import httpx

from app.core.config import settings

def get_apod_today() -> dict:
    response = httpx.get(
        "https://api.nasa.gov/planetary/apod",
        params={"api_key": settings.nasa_api_key},
        timeout=20,
    )
    response.raise_for_status()
    return response.json()
```

The dashboard already consumes these backend routes from
`frontend/src/api/space.ts`.

## Supabase Setup

This backend currently uses SQLAlchemy, so the most important Supabase value is
the PostgreSQL connection string.

In Supabase:

1. Open your project.
2. Go to Project Settings.
3. Open Database.
4. Copy the connection string.
5. Use the SQLAlchemy/psycopg format in `DATABASE_URL`.

Example:

```env
DATABASE_URL="postgresql+psycopg://postgres.your-project-ref:your-password@aws-0-your-region.pooler.supabase.com:6543/postgres"
```

If your password contains special characters, URL-encode it before putting it in
`DATABASE_URL`.

Optional Supabase values are already reserved in `backend/.env.example`:

```env
SUPABASE_URL=""
SUPABASE_ANON_KEY=""
SUPABASE_SERVICE_ROLE_KEY=""
```

Use those later only if you add direct Supabase client features such as storage,
realtime channels, or Supabase Auth. For the current custom FastAPI auth flow,
`DATABASE_URL` is enough.

## Render Backend Hosting

Create a Render Web Service for the `backend` folder.

Suggested settings:

- Root directory: `backend`
- Runtime: Python
- Build command: `uv pip install -r requirements.txt`
- Start command: `uv run uvicorn app.main:app --host 0.0.0.0 --port $PORT`

Add these environment variables in Render:

```env
APP_ENV="production"
DATABASE_URL="your-supabase-postgres-url"
JWT_SECRET_KEY="use-a-long-random-secret"
JWT_ALGORITHM="HS256"
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=60
NASA_API_KEY="your-nasa-api-key"
GEMINI_API_KEY="your-gemini-api-key"
GEMINI_MODEL="gemini-3.5-flash"
GEMINI_FALLBACK_MODELS=""
FRONTEND_ORIGIN="https://your-vercel-app.vercel.app"
```

## Vercel Frontend Hosting

Create a Vercel project for the `frontend` folder.

Suggested settings:

- Framework preset: Vite
- Root directory: `frontend`
- Build command: `npm.cmd run build` locally, `npm run build` on Vercel
- Output directory: `dist`

Add this environment variable in Vercel:

```env
VITE_API_BASE_URL="https://your-render-service.onrender.com/api"
```

After changing Vercel environment variables, redeploy the frontend.

## Deployment Connection Checklist

Before deploying:

1. Supabase `DATABASE_URL` is added to Render.
2. Render `FRONTEND_ORIGIN` matches your Vercel URL exactly.
3. Vercel `VITE_API_BASE_URL` points to your Render backend and ends with `/api`.
4. NASA and Gemini keys are added to Render, not Vercel.
5. `JWT_SECRET_KEY` is changed from `change-me`.

## Auth Flow

Current auth is custom FastAPI auth using the configured database:

1. User submits `/register` or `/login` in React.
2. React calls the FastAPI auth route.
3. FastAPI validates credentials and returns a JWT.
4. React stores the JWT in `localStorage`.
5. Protected pages call `/api/auth/me` to restore the session.

This does not currently use Supabase Auth. Supabase is used as PostgreSQL through
`DATABASE_URL`. If you later choose to use Supabase Auth instead, replace the
custom auth routes and update `frontend/src/auth/AuthProvider.tsx`.
