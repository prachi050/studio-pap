"""Tests for screen capture AI analysis routes."""

from pathlib import Path

from fastapi.testclient import TestClient

from app.core.config import Settings
from app.main import create_app
from app.models.analysis import DesignAnalysisResult
from app.services.ai_analysis import AIVisionAnalysisService


def create_test_client(tmp_path: Path) -> TestClient:
    app = create_app(Settings(UPLOADS_DIR=tmp_path, OPENAI_API_KEY="test-key"))
    return TestClient(app)


def test_screen_analyze_returns_ai_feedback(monkeypatch, tmp_path: Path) -> None:
    async def fake_analyze_screenshot(
        self,
        image_bytes: bytes,
        content_type: str,
        domain="ux_ui_product",
    ) -> DesignAnalysisResult:
        return DesignAnalysisResult(
            summary="The screen has a clear foundation but needs stronger hierarchy.",
            suggestions=[
                "Increase heading contrast.",
                "Create more consistent spacing.",
                "Improve button prominence.",
            ],
        )

    monkeypatch.setattr(AIVisionAnalysisService, "analyze_screenshot", fake_analyze_screenshot)
    client = create_test_client(tmp_path)

    response = client.post(
        "/screen/analyze",
        files={"screenshot": ("screenshot.png", b"fake-image-bytes", "image/png")},
    )

    assert response.status_code == 200
    assert response.json() == {
        "status": "success",
        "summary": "The screen has a clear foundation but needs stronger hierarchy.",
        "suggestions": [
            "Increase heading contrast.",
            "Create more consistent spacing.",
            "Improve button prominence.",
        ],
    }


def test_screen_analyze_rejects_non_image(tmp_path: Path) -> None:
    client = create_test_client(tmp_path)

    response = client.post(
        "/screen/analyze",
        files={"screenshot": ("notes.txt", b"not-an-image", "text/plain")},
    )

    assert response.status_code == 415
