"""Application factory. Run with: uvicorn app.main:create_app --factory --reload --port 8000"""

import importlib
import shutil
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.exception_handlers import http_exception_handler
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
from fastapi.staticfiles import StaticFiles
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.config import Settings, get_settings
from app.db import create_pool
from app.errors import ApiError, api_error_handler
from app.middleware import UPLOAD_OVERHEAD, BodySizeLimitMiddleware

PLACEHOLDER = Path(__file__).resolve().parent / "static" / "placeholder.svg"

ROUTER_MODULES = (
    "auth", "users", "taxonomy", "site", "products", "cart", "orders", "comments",
    "messages", "dashboard",
)  # fmt: skip


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or get_settings()
    upload_dir = settings.upload_dir
    upload_dir.mkdir(parents=True, exist_ok=True)

    @asynccontextmanager
    async def lifespan(app: FastAPI) -> AsyncIterator[None]:
        pool = create_pool(settings.database_url)
        pool.open(wait=True, timeout=10)
        app.state.pool = pool
        shutil.copyfile(PLACEHOLDER, upload_dir / "placeholder.svg")
        try:
            yield
        finally:
            pool.close()

    app = FastAPI(
        title="E-commerce API",
        lifespan=lifespan,
        docs_url="/api/docs",
        redoc_url=None,
        openapi_url="/api/openapi.json",
    )
    # Innermost on purpose: its 413 answers still get the CORS and nosniff headers.
    app.add_middleware(
        BodySizeLimitMiddleware, upload_limit=settings.max_upload_bytes + UPLOAD_OVERHEAD
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.middleware("http")
    async def forbid_content_sniffing(request: Request, call_next) -> Response:
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        return response

    app.add_exception_handler(ApiError, api_error_handler)

    @app.exception_handler(StarletteHTTPException)
    async def http_error(request: Request, exc: StarletteHTTPException) -> Response:
        if exc.status_code == 404:
            return JSONResponse(status_code=404, content={"detail": "not_found"})
        return await http_exception_handler(request, exc)

    @app.get("/api/health")
    def health(request: Request) -> JSONResponse:
        try:
            with request.app.state.pool.connection(timeout=2) as conn:
                conn.execute("SELECT 1")
        except Exception:
            return JSONResponse(status_code=503, content={"status": "error", "db": False})
        return JSONResponse(content={"status": "ok", "db": True})

    for name in ROUTER_MODULES:
        module = importlib.import_module(f"app.routers.{name}")
        app.include_router(module.router, prefix="/api")
        app.include_router(module.admin_router, prefix="/api/admin")

    app.mount("/api/media", StaticFiles(directory=upload_dir), name="media")
    return app
