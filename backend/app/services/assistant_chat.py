"""Studio PAP assistant chat service."""

import base64
import re
from typing import Any

import httpx
from loguru import logger

from app.core.config import Settings


class AssistantChatConfigurationError(RuntimeError):
    """Raised when assistant chat is not configured."""


class AssistantChatError(RuntimeError):
    """Raised when assistant chat fails."""


class AssistantChatService:
    """Generate contextual Studio PAP assistant responses."""

    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    async def answer_question(
        self,
        question: str,
        latest_analysis: dict[str, Any] | None,
        image_bytes: bytes | None = None,
        image_content_type: str | None = None,
    ) -> str:
        if not self.settings.openai_api_key:
            raise AssistantChatConfigurationError(
                "OPENAI_API_KEY is not configured."
            )

        content: list[dict[str, Any]] = [
            {
                "type": "input_text",
                "text": self._build_prompt(
                    question=question,
                    latest_analysis=latest_analysis,
                    image_attached=bool(
                        image_bytes and image_content_type
                    ),
                ),
            }
        ]

        if image_bytes and image_content_type:
            content.append(
                {
                    "type": "input_image",
                    "image_url": self._build_image_data_url(
                        image_bytes=image_bytes,
                        content_type=image_content_type,
                    ),
                }
            )

        payload = {
            "model": self.settings.assistant_model,
            "input": [
                {
                    "role": "user",
                    "content": content,
                }
            ],
        }

        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    f"{self.settings.openai_base_url}/responses",
                    headers={
                        "Authorization": (
                            f"Bearer {self.settings.openai_api_key}"
                        ),
                        "Content-Type": "application/json",
                    },
                    json=payload,
                )

                response.raise_for_status()

        except httpx.HTTPStatusError as exc:
            logger.exception("Assistant returned HTTP error")

            try:
                error_json = exc.response.json()
                message = error_json.get("error", {}).get(
                    "message",
                    "Assistant request failed.",
                )
            except Exception:
                message = exc.response.text

            raise AssistantChatError(message) from exc

        except httpx.HTTPError as exc:
            logger.exception("Assistant request failed")

            raise AssistantChatError(
                "Unable to contact OpenAI."
            ) from exc

        answer = self._extract_output_text(response.json())

        if not answer:
            raise AssistantChatError(
                "Assistant returned an empty response."
            )

        return self._clean_text(answer)

    def _build_prompt(
        self,
        question: str,
        latest_analysis: dict[str, Any] | None,
        image_attached: bool,
    ) -> str:
        image_context = (
            "A current design image is attached to this request."
            if image_attached
            else "No current design image is attached to this request."
        )

        return f"""
You are Aria, the senior AI design partner inside Studio PAP.

Studio PAP provides professional feedback for UX/UI, product design,
websites, mobile apps, dashboards, branding, typography, presentations,
jewelry, interiors, architecture, fashion, industrial design, and other
visual creative work.

Stay focused on design and visual creativity. If a request is unrelated to
design, respond exactly with:

Sorry, I'm designed exclusively for design.

I can help with UX/UI, branding, websites, jewelry, interiors,
architecture, presentations, products, and other creative design
questions.

Upload a design or ask me a design-related question, and I'll be happy
to help.

CURRENT VISUAL CONTEXT
{image_context}

PREVIOUS DESIGN CONTEXT
{latest_analysis}

USER REQUEST
{question}

RESPONSE RULES
Answer as a thoughtful senior designer speaking naturally to another
designer. Give the most useful answer first. Be specific, practical,
honest, and concise.

When an image is attached, review only details genuinely visible in that
image. Do not invent interface elements, colors, interactions, materials,
user behavior, business goals, or screens outside the visible frame.

When previous design context is supplied, use it as conversation memory
only when relevant. Do not repeat the entire previous review. If the
current image is attached, never claim that you cannot see the screenshot.

For a focused follow-up, answer the exact question directly and keep the
response under 120 words. For a full review, keep the response between
100 and 150 words unless the user explicitly asks for more detail.

Do not use markdown, headings, hashtags, bullet points, numbered lists,
tables, bold text, or decorative symbols. Write in short natural
paragraphs suitable for spoken audio.

Avoid repetition. Each observation must add new information. Explain what
you observed, why it matters, and what practical change would improve it.
Praise only visible choices that genuinely work.
""".strip()

    def _build_image_data_url(
        self,
        image_bytes: bytes,
        content_type: str,
    ) -> str:
        encoded = base64.b64encode(image_bytes).decode("utf-8")

        return f"data:{content_type};base64,{encoded}"

    def _extract_output_text(
        self,
        response_data: dict[str, Any],
    ) -> str | None:
        output_text = response_data.get("output_text")

        if output_text:
            return output_text

        for output in response_data.get("output", []):
            for content in output.get("content", []):
                if content.get("type") in {
                    "output_text",
                    "text",
                }:
                    return content.get("text")

        return None

    def _clean_text(
        self,
        text: str,
    ) -> str:
        text = re.sub(r"[^\x00-\x7F]+", "", text)
        text = re.sub(r"^#{1,6}\s*", "", text, flags=re.MULTILINE)
        text = re.sub(r"\*\*(.*?)\*\*", r"\1", text)
        text = re.sub(r"__(.*?)__", r"\1", text)
        text = re.sub(
            r"^\s*(?:[-*]|\d+[.)])\s+",
            "",
            text,
            flags=re.MULTILINE,
        )

        text = re.sub(
            r"\n?\s*---+\s*\n?",
            "\n\n",
            text,
        )

        lines: list[str] = []

        for line in text.splitlines():
            lines.append(
                re.sub(
                    r"[ \t]+",
                    " ",
                    line,
                ).strip()
            )

        cleaned = "\n".join(lines)

        cleaned = re.sub(
            r"\n{3,}",
            "\n\n",
            cleaned,
        )

        return cleaned.strip()