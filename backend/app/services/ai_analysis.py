"""Reusable AI vision analysis service."""

import base64
import json
from typing import Any

import httpx
from loguru import logger

from app.core.config import Settings
from app.models.analysis import DesignAnalysisResult
from app.services.analysis_prompts import AnalysisDomain, build_analysis_prompt


class AIAnalysisConfigurationError(RuntimeError):
    """Raised when the AI analysis service is not configured."""


class AIAnalysisError(RuntimeError):
    """Raised when the AI analysis call fails."""


ANALYSIS_RESPONSE_SCHEMA: dict[str, Any] = {
    "type": "object",
    "additionalProperties": False,
    "properties": {
        "screen_type": {"type": "string"},
        "design_score": {"type": "integer", "minimum": 0, "maximum": 100},
        "accessibility_score": {"type": "integer", "minimum": 0, "maximum": 100},
        "hierarchy_score": {"type": "integer", "minimum": 0, "maximum": 100},
        "typography_score": {"type": "integer", "minimum": 0, "maximum": 100},
        "spacing_score": {"type": "integer", "minimum": 0, "maximum": 100},
        "color_score": {"type": "integer", "minimum": 0, "maximum": 100},
        "summary": {"type": "string"},
        "suggestions": {
            "type": "array",
            "items": {"type": "string"},
            "minItems": 3,
            "maxItems": 8,
        },
        "quick_wins": {
            "type": "array",
            "items": {"type": "string"},
            "minItems": 1,
            "maxItems": 3,
        },
        "top_priority": {"type": "string"},
    },
    "required": [
        "screen_type",
        "design_score",
        "accessibility_score",
        "hierarchy_score",
        "typography_score",
        "spacing_score",
        "color_score",
        "summary",
        "suggestions",
        "quick_wins",
        "top_priority",
    ],
}


class AIVisionAnalysisService:
    """Analyze screenshots with an AI vision model."""

    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    async def analyze_screenshot(
        self,
        image_bytes: bytes,
        content_type: str,
        domain: AnalysisDomain = "ux_ui_product",
    ) -> DesignAnalysisResult:
        """Analyze a screenshot and return structured design feedback."""
        if not self.settings.openai_api_key:
            raise AIAnalysisConfigurationError("OPENAI_API_KEY is not configured.")

        image_data_url = self._build_image_data_url(image_bytes, content_type)
        payload = self._build_responses_payload(image_data_url, domain)

        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    f"{self.settings.openai_base_url}/responses",
                    headers={
                        "Authorization": f"Bearer {self.settings.openai_api_key}",
                        "Content-Type": "application/json",
                    },
                    json=payload,
                )
                response.raise_for_status()
        except httpx.HTTPStatusError as exc:
            logger.exception("AI vision analysis returned an HTTP error")
            raise AIAnalysisError("AI vision analysis failed.") from exc
        except httpx.HTTPError as exc:
            logger.exception("AI vision analysis request failed")
            raise AIAnalysisError("Unable to reach AI vision service.") from exc

        return self._parse_analysis_response(response.json())

    def _build_responses_payload(
        self,
        image_data_url: str,
        domain: AnalysisDomain,
    ) -> dict[str, Any]:
        return {
            "model": self.settings.ai_vision_model,
            "input": [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "input_text",
                            "text": build_analysis_prompt(domain),
                        },
                        {
                            "type": "input_image",
                            "image_url": image_data_url,
                        },
                    ],
                }
            ],
            "text": {
                "format": {
                    "type": "json_schema",
                    "name": "ghost_designer_analysis",
                    "strict": True,
                    "schema": ANALYSIS_RESPONSE_SCHEMA,
                }
            },
        }

    def _build_image_data_url(self, image_bytes: bytes, content_type: str) -> str:
        encoded_image = base64.b64encode(image_bytes).decode("utf-8")
        return f"data:{content_type};base64,{encoded_image}"

    def _parse_analysis_response(self, response_data: dict[str, Any]) -> DesignAnalysisResult:
        output_text = response_data.get("output_text")

        if not output_text:
            output_text = self._extract_output_text(response_data)

        if not output_text:
            logger.error("AI response did not include output text", response=response_data)
            raise AIAnalysisError("AI vision analysis returned an empty response.")

        try:
            parsed = json.loads(output_text)
        except json.JSONDecodeError as exc:
            logger.exception("AI response was not valid JSON")
            raise AIAnalysisError("AI vision analysis returned an invalid response.") from exc

        return DesignAnalysisResult(status="success", **parsed)

    def _extract_output_text(self, response_data: dict[str, Any]) -> str | None:
        for output_item in response_data.get("output", []):
            for content_item in output_item.get("content", []):
                if content_item.get("type") in {"output_text", "text"}:
                    return content_item.get("text")
        return None