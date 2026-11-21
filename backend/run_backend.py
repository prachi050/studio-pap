from pathlib import Path
import sys

import uvicorn
from dotenv import load_dotenv

if getattr(sys, "frozen", False):
    env_path = Path(sys._MEIPASS) / "backend" / ".env"
else:
    env_path = Path(__file__).parent / ".env"

load_dotenv(env_path)

from app.main import app


if __name__ == "__main__":
    uvicorn.run(
        app,
        host="127.0.0.1",
        port=8000,
        log_level="info",
    )