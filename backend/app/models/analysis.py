"""Models for AI design analysis responses."""

from pydantic import BaseModel, Field


class DesignAnalysisResult(BaseModel):
    """Structured result returned from AI vision analysis."""

    status: str = "success"
    screen_type: str = Field(min_length=1)
    design_score: int = Field(ge=0, le=100)
    accessibility_score: int = Field(ge=0, le=100)
    hierarchy_score: int = Field(ge=0, le=100)
    typography_score: int = Field(ge=0, le=100)
    spacing_score: int = Field(ge=0, le=100)
    color_score: int = Field(ge=0, le=100)
    summary: str = Field(min_length=1)
    suggestions: list[str] = Field(min_length=1)
    quick_wins: list[str] = Field(min_length=1)
    top_priority: str = Field(min_length=1)