# richmiles.xyz

Personal portfolio site built as a Vite + React + TypeScript SPA with a FastAPI backend. Caddy serves the built frontend and proxies `/api/*` to uvicorn inside a single container.

## Local development

Fast iteration (Vite dev server):

```bash
npm install
npm run dev
```

Production-like (Caddy serving the built SPA + health endpoints):

```bash
make dev
```

Then open `http://127.0.0.1:8000`.

## Public API

The site now exposes machine-readable portfolio data:

- `GET /api/v1/profile`
- `GET /api/v1/experience`
- `GET /api/v1/projects`

`/api/v1/projects` prefers live Spark Swarm data and falls back to repo content when the upstream API is unavailable.

## Health endpoints

Served by FastAPI through Caddy inside the container:

- `GET /healthz`
- `GET /api/v1/healthz` (proxy routing check for the fleet contract)

## Deploy

This repo follows the Spark Swarm fleet contract.

- Ephemeral staging: `deploy/pack.toml` + GitHub Action `Ephemeral Staging` (manual or `/stage` PR comment; owner-only).
- Production: `./bin/platform prod rollout richmiles-xyz --tag sha-<short> --yes` (pins `RICHMILES_XYZ_IMAGE_TAG`, pulls, restarts, health-checks).

More detail: `docs/deploy.md`.

## Tests

Backend API tests live under `backend/tests/` and run with:

```bash
make test
```
