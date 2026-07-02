"""Logging setup for the application."""

import sys

from loguru import logger

from app.core.config import Settings


def configure_logging(settings: Settings) -> None:
    """Configure Loguru sinks for console and file logging."""
    settings.log_file.parent.mkdir(parents=True, exist_ok=True)

    logger.remove()
    logger.add(
        sys.stderr,
        level=settings.log_level,
        enqueue=True,
        backtrace=settings.debug,
        diagnose=settings.debug,
    )
    logger.add(
        settings.log_file,
        level=settings.log_level,
        rotation="10 MB",
        retention="14 days",
        compression="zip",
        enqueue=True,
        backtrace=settings.debug,
        diagnose=settings.debug,
    )
