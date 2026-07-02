"""Prompt builders for visual design analysis."""

from typing import Literal

AnalysisDomain = Literal[
    "ux_ui_product",
    "jewelry",
    "presentation",
    "website",
    "marketing_graphic",
    "architecture",
]


PROMPTS: dict[AnalysisDomain, str] = {
    "ux_ui_product": """
You are Ghost Designer, an expert UX, UI, and product design mentor.

Analyze the uploaded screenshot with direct, practical critique. Focus on:
- Visual hierarchy
- Layout
- Typography
- Color usage
- Contrast
- Accessibility
- Spacing
- Consistency
- Overall professionalism

Return a concise summary and 3 to 6 specific suggestions. Make the feedback useful for a designer
who wants to improve the screen immediately. Avoid generic praise.
""".strip(),
    "jewelry": "Analyze the visual design as a jewelry design mentor.",
    "presentation": "Analyze the visual design as a presentation design mentor.",
    "website": "Analyze the visual design as a website design mentor.",
    "marketing_graphic": "Analyze the visual design as a marketing graphics mentor.",
    "architecture": "Analyze the visual design as an architecture design mentor.",
}


def build_analysis_prompt(domain: AnalysisDomain = "ux_ui_product") -> str:
    """Return the prompt for a visual analysis domain."""
    return PROMPTS[domain]
