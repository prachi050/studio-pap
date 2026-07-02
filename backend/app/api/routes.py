"""Application routes."""

from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, File, HTTPException, Request, UploadFile, status
from loguru import logger

from app.models.analysis import DesignAnalysisResult
from app.services.ai_analysis import (
    AIAnalysisConfigurationError,
    AIAnalysisError,
    AIVisionAnalysisService,
)
from app.utils.uploads import (
    ALLOWED_SCREENSHOT_EXTENSIONS,
    is_supported_screenshot_content_type,
)

router = APIRouter()


@router.get("/", tags=["system"])
async def read_root() -> dict[str, str]:
    """Return basic application status."""
    return {
        "status": "running",
        "project": "Ghost Designer",
    }


@router.post("/screen/upload", tags=["screen"])
async def upload_screen_capture(
    request: Request,
    screenshot: UploadFile = File(...),
) -> dict[str, str]:
    """Receive a temporary screen capture image and save it to uploads."""
    if not is_supported_screenshot_content_type(screenshot.content_type):
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Unsupported screenshot file type.",
        )

    uploads_dir: Path = request.app.state.settings.uploads_dir
    uploads_dir.mkdir(parents=True, exist_ok=True)

    file_extension = Path(screenshot.filename or "screenshot.png").suffix.lower()
    if file_extension not in ALLOWED_SCREENSHOT_EXTENSIONS:
        file_extension = ".png"

    filename = f"screenshot-{uuid4().hex}{file_extension}"
    destination = uploads_dir / filename
    file_bytes = b""

    try:
        file_bytes = await screenshot.read()
        destination.write_bytes(file_bytes)
    except OSError as exc:
        logger.exception("Failed to save uploaded screenshot")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save uploaded screenshot.",
        ) from exc
    finally:
        await screenshot.close()

    logger.info(
        "Screenshot uploaded temporarily",
        filename=filename,
        size_bytes=len(file_bytes),
        content_type=screenshot.content_type,
    )

    return {
        "status": "uploaded",
        "filename": filename,
        "message": "Screenshot received successfully.",
    }


@router.post("/screen/analyze", tags=["screen"])
async def analyze_screen_capture(
    request: Request,
    screenshot: UploadFile = File(...),
) -> DesignAnalysisResult:
    """Analyze an uploaded screenshot with AI vision."""
    if not is_supported_screenshot_content_type(screenshot.content_type):
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Unsupported screenshot file type.",
        )

    try:
        file_bytes = await screenshot.read()
    finally:
        await screenshot.close()

    if not file_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded screenshot is empty.",
        )

    analysis_service = AIVisionAnalysisService(request.app.state.settings)

    try:
        return await analysis_service.analyze_screenshot(
            image_bytes=file_bytes,
            content_type=screenshot.content_type or "image/png",
        )
    except AIAnalysisConfigurationError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc
    except AIAnalysisError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(exc),
        ) from exc
