"""Models for AI design analysis responses."""

from pydantic import BaseModel, Field


class DesignAnalysisResult(BaseModel):
    """Structured result returned from AI vision analysis."""

    status: str = "success"
    summary: str = Field(min_length=1)
    suggestions: list[str] = Field(min_length=1)
