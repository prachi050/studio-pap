"""Studio PAP voice transcription service."""

from typing import Any

import httpx
from loguru import logger

from app.core.config import Settings


class VoiceTranscriptionConfigurationError(RuntimeError):
    """Raised when voice transcription is not configured."""


class VoiceTranscriptionError(RuntimeError):
    """Raised when voice transcription fails."""


class VoiceTranscriptionService:
    """Transcribe recorded audio using the OpenAI transcription API."""

    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    async def transcribe(
        self,
        audio_bytes: bytes,
        filename: str,
        content_type: str,
    ) -> str:
        if not self.settings.openai_api_key:
            raise VoiceTranscriptionConfigurationError(
                "OPENAI_API_KEY is not configured."
            )

        if not audio_bytes:
            raise VoiceTranscriptionError("Recorded audio is empty.")

        files = {
            "file": (
                filename,
                audio_bytes,
                content_type,
            )
        }

        data = {
            "model": "gpt-4o-mini-transcribe",
            "response_format": "json",
        }

        try:
            async with httpx.AsyncClient(timeout=90.0) as client:
                response = await client.post(
                    f"{self.settings.openai_base_url}/audio/transcriptions",
                    headers={
                        "Authorization": f"Bearer {self.settings.openai_api_key}",
                    },
                    data=data,
                    files=files,
                )

                response.raise_for_status()

        except httpx.HTTPStatusError as exc:
            logger.exception("Voice transcription returned an HTTP error")

            try:
                error_json: dict[str, Any] = exc.response.json()
                message = error_json.get("error", {}).get(
                    "message",
                    "Voice transcription failed.",
                )
            except Exception:
                message = exc.response.text or "Voice transcription failed."

            raise VoiceTranscriptionError(message) from exc

        except httpx.HTTPError as exc:
            logger.exception("Voice transcription request failed")

            raise VoiceTranscriptionError(
                "Unable to contact the transcription service."
            ) from exc

        response_data = response.json()
        transcript = response_data.get("text")

        if not isinstance(transcript, str) or not transcript.strip():
            raise VoiceTranscriptionError(
                "The transcription service returned no text."
            )

        return transcript.strip()