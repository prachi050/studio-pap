"""Tests for screen capture upload routes."""

from pathlib import Path

from fastapi.testclient import TestClient

from app.core.config import Settings
from app.main import create_app


def create_test_client(tmp_path: Path) -> TestClient:
    app = create_app(Settings(UPLOADS_DIR=tmp_path))
    return TestClient(app)


def test_screen_upload_accepts_image(tmp_path: Path) -> None:
    client = create_test_client(tmp_path)

    response = client.post(
        "/screen/upload",
        files={"screenshot": ("screenshot.png", b"fake-image-bytes", "image/png")},
    )

    assert response.status_code == 200
    assert response.json()["status"] == "uploaded"
    assert response.json()["filename"].startswith("screenshot-")
    assert response.json()["message"] == "Screenshot received successfully."
    assert (tmp_path / response.json()["filename"]).exists()


def test_screen_upload_rejects_non_image(tmp_path: Path) -> None:
    client = create_test_client(tmp_path)

    response = client.post(
        "/screen/upload",
        files={"screenshot": ("notes.txt", b"not-an-image", "text/plain")},
    )

    assert response.status_code == 415
