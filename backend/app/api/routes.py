"""Application routes."""

from fastapi import APIRouter

router = APIRouter()


@router.get("/", tags=["system"])
async def read_root() -> dict[str, str]:
    """Return basic application status."""
    return {
        "status": "running",
        "project": "Ghost Designer",
    }
