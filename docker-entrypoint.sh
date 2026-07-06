#!/usr/bin/env bash
set -euo pipefail
echo "Starting server..."
# `uv sync` runs in /app/backend, so the venv (and the uvicorn console script)
# live at /app/backend/.venv. Run that binary directly with cwd=/app so the
# absolute `backend.*` imports in main.py resolve.
cd /app
exec backend/.venv/bin/uvicorn backend.main:app --host 0.0.0.0 --port 8000
