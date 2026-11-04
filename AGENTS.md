# AGENTS.md - Instructions for coding agents (richmiles.xyz)

This repo is a Vite + React + TypeScript portfolio site with a FastAPI backend. A single uvicorn process serves the API and the built SPA via StaticFiles, all inside a single container.

## Fleet contract (Spark Swarm standard)

This repo participates in the Spark Swarm fleet standard for staging and production deploys.

### Health (required)

Health is served by FastAPI directly:

- `GET /healthz` (public)
- `GET /api/v1/healthz` (verifies API routing)

### Ephemeral staging (required)

- Deploy definition: `deploy/pack.toml`
- GitHub Action: `Ephemeral Staging` (manual or `/stage` PR comment; owner-only)

### Production promotion (required)

- Deploy via platform CLI: `./bin/platform prod rollout richmiles-xyz --tag sha-<short> --yes`
- Pins: `RICHMILES_XYZ_IMAGE_TAG=sha-...` on the prod droplet, pulls, restarts, health-checks
- Health URL: `https://richmiles.xyz/healthz`

### Image + secrets

- Image: `ghcr.io/miles-automation/richmiles-xyz-app:<tag>`
- Secrets: none required; `SPARK_SWARM_API_URL` (optional, lead forwarding)

## Commands (prefer Make)

- Install deps: `make install`
- Dev (local): `make dev` (frontend on :5173, backend on :8001)
- Checks (contract): `make check`
- Build image: `make docker-build`
