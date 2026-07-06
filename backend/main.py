import mimetypes
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any

import httpx
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from backend.config import settings
from backend.logging_config import configure_logging
from backend.portfolio_content import (
    DEFAULT_PROJECT_ICON,
    fallback_projects,
    load_experience,
    load_profile,
    load_project_fallback,
    load_project_icons,
)
from backend.portfolio_schemas import ExperienceListResponse, ProfileResponse, ProjectListResponse, ProjectResponse

# Python's mimetypes DB doesn't always know modern web formats, so FileResponse
# would serve them as application/octet-stream. Register them explicitly.
mimetypes.add_type("image/webp", ".webp")
mimetypes.add_type("image/avif", ".avif")
mimetypes.add_type("image/svg+xml", ".svg")

_http_client: httpx.AsyncClient | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    configure_logging(settings.environment)
    global _http_client
    _http_client = httpx.AsyncClient(timeout=10)
    yield
    await _http_client.aclose()


app = FastAPI(lifespan=lifespan)


@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response


def _enrich_live_projects(sparks: list[dict[str, Any]]) -> list[ProjectResponse]:
    icons = load_project_icons()
    fallback_by_id = {project.id: project for project in load_project_fallback()}
    project_order = {project.id: index for index, project in enumerate(load_project_fallback())}
    projects: list[ProjectResponse] = []

    for spark in sparks:
        slug = spark.get("slug")
        if not slug or slug == "richmiles-xyz":
            continue
        if spark.get("stage") not in {"live", "building"}:
            continue

        fallback = fallback_by_id.get(slug)
        projects.append(
            ProjectResponse(
                id=slug,
                title=spark.get("name") or (fallback.title if fallback else slug),
                description=spark.get("description") or (fallback.description if fallback else ""),
                domain=spark.get("domain") or (fallback.domain if fallback else None),
                stage=spark.get("stage") or (fallback.stage if fallback else "building"),
                health=spark.get("health") or (fallback.health if fallback else "unknown"),
                last_deploy_at=spark.get("last_deploy_at"),
                category=spark.get("category") or (fallback.category if fallback else None),
                icon=icons.get(slug, fallback.icon if fallback else DEFAULT_PROJECT_ICON),
            )
        )

    projects.sort(key=lambda project: (project_order.get(project.id, len(project_order)), project.title.lower()))
    return projects


@app.get("/healthz")
async def healthz():
    return JSONResponse({"status": "ok"})


@app.get("/api/v1/healthz")
async def api_healthz():
    return JSONResponse({"status": "ok"})


@app.get("/api/v1/profile", response_model=ProfileResponse)
async def get_profile():
    return load_profile()


@app.get("/api/v1/experience", response_model=ExperienceListResponse)
async def get_experience():
    return load_experience()


@app.get("/api/v1/projects", response_model=ProjectListResponse)
async def get_projects():
    """Fetch live sparks from Spark Swarm and return as portfolio projects."""
    api_key = settings.spark_swarm_api_key
    if not api_key:
        return fallback_projects(warning="Spark Swarm API key is not configured; serving fallback portfolio data.")

    if _http_client is None:
        raise HTTPException(status_code=503, detail="Service not ready")

    try:
        resp = await _http_client.get(
            f"{settings.spark_swarm_api_url}/sparks",
            headers={"X-API-Key": api_key},
        )
        resp.raise_for_status()
    except httpx.HTTPError:
        return fallback_projects(warning="Spark Swarm is unavailable; serving fallback portfolio data.")

    sparks = resp.json().get("sparks", [])
    return ProjectListResponse(projects=_enrich_live_projects(sparks), source="live")


# SPA catch-all (when static dir exists from Docker build)
STATIC_DIR = Path(__file__).parent / "static"
if STATIC_DIR.exists():
    app.mount("/assets", StaticFiles(directory=str(STATIC_DIR / "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        if full_path.startswith("api/"):
            raise HTTPException(status_code=404)
        file_path = STATIC_DIR / full_path
        if file_path.is_file():
            # Static assets (images, css, fonts, favicon, robots) — cache a week.
            return FileResponse(file_path, headers={"Cache-Control": "public, max-age=604800"})
        # index.html is the SPA shell; never cache it so deploys are picked up.
        return FileResponse(STATIC_DIR / "index.html", headers={"Cache-Control": "no-cache"})
