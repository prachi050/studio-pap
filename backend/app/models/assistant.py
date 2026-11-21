"""Models for Studio PAP assistant chat."""

from typing import Any

from pydantic import BaseModel, Field


class AssistantChatRequest(BaseModel):
    """Request body for assistant chat."""

    question: str = Field(min_length=1)
    latest_analysis: dict[str, Any] | None = None


class AssistantChatResponse(BaseModel):
    """Response body for assistant chat."""

    status: str = "success"
    answer: str