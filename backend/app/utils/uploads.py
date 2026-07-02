"""Helpers for uploaded images."""

ALLOWED_SCREENSHOT_CONTENT_TYPES = {"image/png", "image/jpeg", "image/webp"}
ALLOWED_SCREENSHOT_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp"}


def is_supported_screenshot_content_type(content_type: str | None) -> bool:
    """Return whether an uploaded screenshot content type is supported."""
    return content_type in ALLOWED_SCREENSHOT_CONTENT_TYPES
