# Project Plan

## Phase 1: Core Production Application

### 1. Foundation

- Create monorepo structure.
- Configure frontend and backend apps.
- Add shared development documentation.
- Add environment variable templates.

### 2. Authentication

- Implement registration and login.
- Hash passwords with bcrypt.
- Issue JWT access tokens.
- Add protected frontend routes.
- Current backend routes: `/api/auth/register`, `/api/auth/login`, `/api/auth/me`.

### 3. APOD Integration

- Fetch today's APOD from NASA.
- Store APOD records.
- Generate Gemini summaries.
- Render APOD summary on the dashboard.

### 4. Asteroid Monitoring

- Integrate NASA NeoWs.
- Normalize asteroid records.
- Add hazardous asteroid views and stats.
- Prepare realtime asteroid update events.

### 5. Space Weather

- Integrate DONKI solar flares, CMEs, and storms.
- Normalize event records.
- Generate simplified AI explanations.
- Trigger notification records for important events.

### 6. Mars Explorer

- Integrate Mars Rover Photos.
- Add rover, camera, and sol/date filters.
- Build gallery and saved items flow.

### 7. Realtime Infrastructure

- Add FastAPI WebSocket endpoint.
- Broadcast notification and event updates.
- Connect frontend dashboard to live updates.

### 8. Production Readiness

- Add tests for API routes and services.
- Add rate limiting and CORS hardening.
- Prepare Vercel and Render deployment configs.

## Phase 2: Advanced Automation

- Autonomous ingestion jobs.
- Anomaly detection.
- Predictive analytics.
- AI agent workflows.
- EPIC API integration.
