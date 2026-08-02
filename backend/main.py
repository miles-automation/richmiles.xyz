import mimetypes
from collections import OrderedDict, deque
from contextlib import asynccontextmanager
from pathlib import Path
from time import monotonic
from typing import Any

import httpx
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from starlette.types import ASGIApp, Receive, Scope, Send

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
from backend.portfolio_schemas import (
    ExperienceListResponse,
    LeadRequest,
    ProfileResponse,
    ProjectListResponse,
    ProjectResponse,
)

# Python's mimetypes DB doesn't always know modern web formats, so FileResponse
# would serve them as application/octet-stream. Register them explicitly.
mimetypes.add_type("image/webp", ".webp")
mimetypes.add_type("image/avif", ".avif")
mimetypes.add_type("image/svg+xml", ".svg")

_http_client: httpx.AsyncClient | None = None
LEAD_FAILURE_DETAIL = "Could not submit right now — email me instead: me@richmiles.xyz"
LEAD_BODY_MAX_BYTES = 64 * 1024
LEAD_BODY_TOO_LARGE_DETAIL = "Request body too large."
LEAD_RATE_LIMIT_MAX_REQUESTS = 5
LEAD_RATE_LIMIT_WINDOW_SECONDS = 60 * 60
LEAD_RATE_LIMIT_MAX_CLIENTS = 4096
_lead_rate_buckets: OrderedDict[str, deque[float]] = OrderedDict()


class LeadBodySizeLimitMiddleware:
    """Reject oversized lead bodies before FastAPI buffers and parses them."""

    def __init__(self, app: ASGIApp, max_bytes: int = LEAD_BODY_MAX_BYTES) -> None:
        self.app = app
        self.max_bytes = max_bytes

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http" or scope["method"] != "POST" or scope["path"] != "/api/v1/lead":
            await self.app(scope, receive, send)
            return

        headers = dict(scope.get("headers", []))
        content_length = headers.get(b"content-length")
        if content_length is not None:
            try:
                if int(content_length) > self.max_bytes:
                    await self._reject(scope, receive, send)
                    return
            except ValueError:
                # A malformed hint is handled by the bounded read below.
                pass

        buffered_messages: list[dict[str, Any]] = []
        body_size = 0
        while True:
            message = await receive()
            if message["type"] != "http.request":
                buffered_messages.append(message)
                break

            body_size += len(message.get("body", b""))
            if body_size > self.max_bytes:
                await self._reject(scope, receive, send)
                return

            buffered_messages.append(message)
            if not message.get("more_body", False):
                break

        message_index = 0

        async def replay_receive() -> dict[str, Any]:
            nonlocal message_index
            if message_index < len(buffered_messages):
                message = buffered_messages[message_index]
                message_index += 1
                return message
            return await receive()

        await self.app(scope, replay_receive, send)

    async def _reject(self, scope: Scope, receive: Receive, send: Send) -> None:
        response = JSONResponse(status_code=413, content={"detail": LEAD_BODY_TOO_LARGE_DETAIL})
        await response(scope, receive, send)


@asynccontextmanager
async def lifespan(app: FastAPI):
    configure_logging(settings.environment)
    global _http_client
    _http_client = httpx.AsyncClient(timeout=10)
    yield
    await _http_client.aclose()


def _request_client_ip(request: Request) -> str:
    return request.client.host if request.client else "unknown"


def _forwarded_for_header(request: Request) -> str:
    client_ip = _request_client_ip(request)
    inbound_xff = request.headers.get("x-forwarded-for")
    if not inbound_xff:
        return client_ip

    # Preserve the proxy chain and append this trusted hop; upstream can use its right-most trusted value.
    return f"{inbound_xff}, {client_ip}"


def _lead_rate_limited(client_ip: str) -> bool:
    now = monotonic()
    bucket = _lead_rate_buckets.get(client_ip)
    if bucket is None:
        bucket = deque()
        _lead_rate_buckets[client_ip] = bucket
    else:
        _lead_rate_buckets.move_to_end(client_ip)

    cutoff = now - LEAD_RATE_LIMIT_WINDOW_SECONDS
    while bucket and bucket[0] <= cutoff:
        bucket.popleft()

    if len(bucket) >= LEAD_RATE_LIMIT_MAX_REQUESTS:
        return True

    bucket.append(now)
    if len(_lead_rate_buckets) > LEAD_RATE_LIMIT_MAX_CLIENTS:
        _lead_rate_buckets.popitem(last=False)
    return False


docs_enabled = settings.environment.lower() in {"dev", "development"}
app = FastAPI(
    lifespan=lifespan,
    docs_url="/docs" if docs_enabled else None,
    redoc_url="/redoc" if docs_enabled else None,
    openapi_url="/openapi.json" if docs_enabled else None,
)
app.add_middleware(LeadBodySizeLimitMiddleware)


@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
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


@app.post("/api/v1/lead")
async def submit_lead(request: Request, lead: LeadRequest):
    client_ip = _request_client_ip(request)
    if _lead_rate_limited(client_ip):
        return JSONResponse(status_code=429, content={"detail": "Too many submissions, please try again later."})

    if _http_client is None:
        return JSONResponse(status_code=503, content={"detail": LEAD_FAILURE_DETAIL})

    payload = {
        "email": lead.email,
        "name": lead.name,
        "company": lead.company,
        "message": lead.message,
        "source_url": "https://richmiles.xyz/#services",
        "website": lead.website,
    }

    try:
        response = await _http_client.post(
            f"{settings.spark_swarm_api_url.rstrip('/')}/public/sparks/richmiles-xyz/leads",
            json=payload,
            headers={"X-Forwarded-For": _forwarded_for_header(request)},
        )
    except httpx.RequestError:
        return JSONResponse(status_code=503, content={"detail": LEAD_FAILURE_DETAIL})

    if response.status_code == 202:
        try:
            return JSONResponse(status_code=202, content=response.json())
        except ValueError:
            return JSONResponse(status_code=503, content={"detail": LEAD_FAILURE_DETAIL})

    if response.status_code == 429:
        return JSONResponse(status_code=429, content={"detail": "Too many submissions, please try again later."})

    return JSONResponse(status_code=503, content={"detail": LEAD_FAILURE_DETAIL})


# SPA catch-all (when static dir exists from Docker build)
STATIC_DIR = Path(__file__).parent / "static"
if STATIC_DIR.exists():
    app.mount("/assets", StaticFiles(directory=str(STATIC_DIR / "assets")), name="assets")


@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    if full_path.startswith("api/"):
        raise HTTPException(status_code=404)
    if full_path.rstrip("/") in {"docs", "redoc", "openapi.json"}:
        raise HTTPException(status_code=404)

    static_root = STATIC_DIR.resolve()
    index_path = static_root / "index.html"
    if not index_path.is_file():
        raise HTTPException(status_code=404)

    candidate = (static_root / full_path).resolve()
    if not candidate.is_relative_to(static_root):
        # Keep traversal attempts on the SPA shell rather than serving outside the static root.
        return FileResponse(index_path, headers={"Cache-Control": "no-cache"})
    if candidate.is_file():
        # Static assets (images, css, fonts, favicon, robots) — cache a week.
        return FileResponse(candidate, headers={"Cache-Control": "public, max-age=604800"})
    # index.html is the SPA shell; never cache it so deploys are picked up.
    return FileResponse(index_path, headers={"Cache-Control": "no-cache"})
