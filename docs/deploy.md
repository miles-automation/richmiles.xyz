# Deploy (Fleet Contract)

This repo participates in the Spark Swarm fleet contract:

## Fleet summary

- Spark key: `richmiles-xyz`
- Image: `ghcr.io/miles-automation/richmiles-xyz-app:<tag>`
- Compose service: `richmiles-xyz`
- Prod domains: `https://richmiles.xyz` (www redirects to apex)
- Health URLs:
  - `https://richmiles.xyz/healthz`
  - `https://richmiles.xyz/api/v1/healthz`

## Ephemeral staging

Source of truth: `deploy/pack.toml`.

Workflow: GitHub Action **Ephemeral Staging**.

- Trigger: workflow dispatch or PR comment `/stage` (owner-only).
- Behavior: builds `linux/amd64`, uploads as `--image-tar`, stages to an ephemeral droplet, then runs the HTTP checks defined in `deploy/pack.toml`.

## Production deployment

Deploy via platform CLI:

```bash
./bin/platform prod rollout richmiles-xyz --tag sha-<short> --yes
```

This pins `RICHMILES_XYZ_IMAGE_TAG`, pulls the image, restarts, and health-checks against `https://richmiles.xyz/healthz`.

## Platform wiring

Production runs on the shared platform droplet managed by `platform-infra`.

- Service wiring: `platform-infra/docker-compose.yml`
- Domain routing + TLS: `platform-infra/Caddyfile`

## Local sanity checks

```bash
make check
make docker-build
make docker-run
```
