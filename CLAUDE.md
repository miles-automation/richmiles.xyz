# CLAUDE.md - richmiles.xyz Notes

Vite + React + TypeScript portfolio site with a FastAPI backend. Single uvicorn process serves the API and the built SPA via StaticFiles.

## Architecture

- **Frontend**: React 19 + Vite 7 SPA (built to `dist/`, copied into `backend/static/` in Docker)
- **Backend**: FastAPI (`backend/main.py`) running on uvicorn `:8000`
- **Serving**: uvicorn on `:8000` — FastAPI serves `/api/*`, `/healthz`, and the SPA catch-all directly (no reverse proxy)
- **Data**: No database. Backend fetches project data from Spark Swarm API at runtime.

## Fleet contract (Spark Swarm standard)

- Health: `GET /healthz` and `GET /api/v1/healthz` (served by FastAPI directly)
- CI/CD: **platform-ci** (not GitHub Actions — this repo has no `.github/workflows`). Merges to `main` auto build + rollout via the webhook to `ci.sparkswarm.com`; PRs get `make check`.
- Production (manual): `./bin/platform build richmiles-xyz --rollout --yes` (build + pull + restart + health-check + auto-rollback)
- Image: `ghcr.io/miles-automation/richmiles-xyz-app:sha-<short>`
- Health URL: `https://richmiles.xyz/healthz`

## Environment variables

- `SPARK_SWARM_API_KEY` — required for fetching project data from Spark Swarm
- `SPARK_SWARM_API_URL` — defaults to `https://sparkswarm.com/api/v1`

## Local dev

```bash
make install
make dev
```

Frontend on `http://127.0.0.1:5173`, backend on `http://127.0.0.1:8001`.
