"""FastAPI application entrypoint."""

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger

from app.api.routes import router
from app.core.config import Settings, get_settings
from app.core.logging import configure_logging


settings = get_settings()


def build_lifespan(active_settings: Settings):
    """Handle application startup and shutdown tasks."""

    @asynccontextmanager
    async def lifespan(app: FastAPI) -> AsyncIterator[None]:
        app.state.settings = active_settings
        active_settings.uploads_dir.mkdir(parents=True, exist_ok=True)
        logger.info("{app_name} backend started", app_name=active_settings.app_name)
        yield
        logger.info("{app_name} backend stopped", app_name=active_settings.app_name)

    return lifespan


def create_app(app_settings: Settings | None = None) -> FastAPI:
    """Create and configure the FastAPI application."""
    active_settings = app_settings or settings
    configure_logging(active_settings)

    fastapi_app = FastAPI(
        title=f"{active_settings.app_name} API",
        version="0.1.0",
        debug=active_settings.debug,
        lifespan=build_lifespan(active_settings),
    )

    fastapi_app.add_middleware(
        CORSMiddleware,
        allow_origins=active_settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    fastapi_app.include_router(router, prefix=active_settings.api_prefix)
    return fastapi_app


app = create_app()
