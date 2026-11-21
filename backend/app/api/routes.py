"""Application routes."""

import json
from pathlib import Path
from uuid import uuid4

from fastapi import (
    APIRouter,
    File,
    Form,
    HTTPException,
    Request,
    UploadFile,
    status,
)
from fastapi.responses import Response
from loguru import logger
from openai import OpenAI
from pydantic import BaseModel, Field

from app.models.analysis import DesignAnalysisResult
from app.models.assistant import AssistantChatRequest, AssistantChatResponse
from app.services.ai_analysis import (
    AIAnalysisConfigurationError,
    AIAnalysisError,
    AIVisionAnalysisService,
)
from app.services.assistant_chat import (
    AssistantChatConfigurationError,
    AssistantChatError,
    AssistantChatService,
)
from app.services.voice_transcription import (
    VoiceTranscriptionConfigurationError,
    VoiceTranscriptionError,
    VoiceTranscriptionService,
)
from app.utils.uploads import (
    ALLOWED_SCREENSHOT_EXTENSIONS,
    is_supported_screenshot_content_type,
)


router = APIRouter()


class AssistantSpeechRequest(BaseModel):
    """Request body for generating an assistant voice response."""

    text: str = Field(
        min_length=1,
        max_length=4096,
    )
    voice: str = "aria"
    speed: float = Field(
        default=1.0,
        ge=0.8,
        le=1.5,
    )


VOICE_CONFIG = {
    "aria": {
        "openai_voice": "coral",
        "instructions": (
            "Speak in a warm, elegant, calm, and thoughtful voice. "
            "Sound like a friendly senior product designer giving "
            "helpful and professional design feedback. Use natural "
            "pacing and clear pronunciation."
        ),
    },
    "luna": {
        "openai_voice": "shimmer",
        "instructions": (
            "Speak in a soft, creative, gentle, and encouraging voice. "
            "Sound supportive and optimistic while remaining polished, "
            "clear, and professional."
        ),
    },
    "ethan": {
        "openai_voice": "onyx",
        "instructions": (
            "Speak in a confident, clear, professional, and analytical "
            "voice. Sound direct and knowledgeable without sounding "
            "harsh. Use measured pacing suitable for UX and product "
            "design reviews."
        ),
    },
}


@router.get("/", tags=["system"])
async def read_root() -> dict[str, str]:
    """Return basic application status."""

    return {
        "status": "running",
        "project": "Studio PAP",
    }


@router.post("/screen/upload", tags=["screen"])
async def upload_screen_capture(
    request: Request,
    screenshot: UploadFile = File(...),
) -> dict[str, str]:
    """Receive a temporary screen capture image and save it."""

    if not is_supported_screenshot_content_type(
        screenshot.content_type
    ):
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Unsupported screenshot file type.",
        )

    uploads_dir: Path = request.app.state.settings.uploads_dir
    uploads_dir.mkdir(parents=True, exist_ok=True)

    file_extension = Path(
        screenshot.filename or "screenshot.png"
    ).suffix.lower()

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

    if not is_supported_screenshot_content_type(
        screenshot.content_type
    ):
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

    analysis_service = AIVisionAnalysisService(
        request.app.state.settings
    )

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


@router.post("/assistant/chat", tags=["assistant"])
async def assistant_chat(
    request: Request,
    chat_request: AssistantChatRequest,
) -> AssistantChatResponse:
    """Answer a design question using saved analysis context."""

    assistant_service = AssistantChatService(
        request.app.state.settings
    )

    try:
        answer = await assistant_service.answer_question(
            question=chat_request.question,
            latest_analysis=chat_request.latest_analysis,
        )

        return AssistantChatResponse(answer=answer)

    except AssistantChatConfigurationError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc

    except AssistantChatError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(exc),
        ) from exc


@router.post(
    "/assistant/chat-with-image",
    tags=["assistant"],
)
async def assistant_chat_with_image(
    request: Request,
    question: str = Form(...),
    latest_analysis: str | None = Form(None),
    image: UploadFile | None = File(None),
) -> AssistantChatResponse:
    """Answer a design question using an optional uploaded image."""

    parsed_latest_analysis = None

    if latest_analysis:
        try:
            parsed_latest_analysis = json.loads(latest_analysis)

        except json.JSONDecodeError as exc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="latest_analysis must be valid JSON.",
            ) from exc

    image_bytes: bytes | None = None
    image_content_type: str | None = None

    if image is not None:
        if not is_supported_screenshot_content_type(
            image.content_type
        ):
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail="Unsupported image file type.",
            )

        try:
            image_bytes = await image.read()
            image_content_type = (
                image.content_type or "image/png"
            )

        finally:
            await image.close()

        if not image_bytes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded image is empty.",
            )

    assistant_service = AssistantChatService(
        request.app.state.settings
    )

    try:
        answer = await assistant_service.answer_question(
            question=question,
            latest_analysis=parsed_latest_analysis,
            image_bytes=image_bytes,
            image_content_type=image_content_type,
        )

        return AssistantChatResponse(answer=answer)

    except AssistantChatConfigurationError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc

    except AssistantChatError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(exc),
        ) from exc


@router.post(
    "/assistant/speech",
    tags=["assistant"],
)
async def assistant_speech(
    request: Request,
    speech_request: AssistantSpeechRequest,
) -> Response:
    """Convert an assistant response into spoken audio."""

    selected_voice = speech_request.voice.lower().strip()

    voice_config = VOICE_CONFIG.get(selected_voice)

    if voice_config is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Unsupported voice. Choose aria, luna, or ethan."
            ),
        )

    speech_text = speech_request.text.strip()

    if not speech_text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Speech text cannot be empty.",
        )

    settings = request.app.state.settings

    api_key = getattr(
        settings,
        "openai_api_key",
        None,
    )

    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="OpenAI API key is not configured.",
        )

    client = OpenAI(api_key=api_key)

    try:
        speech_response = client.audio.speech.create(
            model="gpt-4o-mini-tts",
            voice=voice_config["openai_voice"],
            input=speech_text,
            instructions=voice_config["instructions"],
            response_format="mp3",
            speed=speech_request.speed,
        )

        audio_bytes = speech_response.read()

        return Response(
            content=audio_bytes,
            media_type="audio/mpeg",
            headers={
                "Cache-Control": "no-store",
                "Content-Disposition": (
                    f'inline; filename="{selected_voice}-speech.mp3"'
                ),
            },
        )

    except Exception as exc:
        logger.exception(
            "Assistant speech generation failed",
            voice=selected_voice,
        )

        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Could not generate the assistant voice.",
        ) from exc


@router.post("/voice/transcribe", tags=["voice"])
async def transcribe_voice(
    request: Request,
    audio: UploadFile = File(...),
    language: str = Form(default="en"),
) -> dict[str, str]:
    """Transcribe a recorded audio file into text."""

    allowed_content_types = {
        "audio/webm",
        "audio/webm;codecs=opus",
        "audio/mp4",
        "audio/mpeg",
        "audio/wav",
        "audio/x-wav",
        "audio/ogg",
        "audio/ogg;codecs=opus",
    }

    content_type = (
        audio.content_type or "audio/webm"
    ).lower()

    normalized_content_type = content_type.split(";")[0]

    normalized_allowed_types = {
        item.split(";")[0]
        for item in allowed_content_types
    }

    if normalized_content_type not in normalized_allowed_types:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=(
                f"Unsupported audio file type: "
                f"{audio.content_type or 'unknown'}."
            ),
        )

    try:
        audio_bytes = await audio.read()

    finally:
        await audio.close()

    if not audio_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Recorded audio is empty.",
        )

    transcription_service = VoiceTranscriptionService(
        request.app.state.settings
    )

    try:
        transcript = await transcription_service.transcribe(
            audio_bytes=audio_bytes,
            filename=audio.filename or "recording.webm",
            content_type=normalized_content_type,
        )

        return {
            "transcript": transcript,
            "language": language,
        }

    except VoiceTranscriptionConfigurationError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc

    except VoiceTranscriptionError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(exc),
        ) from exc 