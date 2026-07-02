# Ghost Designer Backend

Python/FastAPI backend for the Ghost Designer desktop AI application.

## Requirements

- Python 3.12
- FastAPI
- Uvicorn
- Pydantic
- python-dotenv
- Loguru
- httpx
- WebSockets support
- CORS enabled

## Setup

```bash
cd backend
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

## Run

```bash
uvicorn app.main:app --reload
```

The API will be available at:

```text
http://127.0.0.1:8000
```

## Endpoints

### GET /

Returns the backend status.

```json
{
  "status": "running",
  "project": "Ghost Designer"
}
```

### POST /screen/upload

Accepts a temporary screenshot image as multipart form data using the field name `screenshot`.

Returns:

```json
{
  "status": "uploaded",
  "filename": "...",
  "message": "Screenshot received successfully."
}
```

Screenshots are saved temporarily in `uploads/`. They are not permanent application storage.

## Project Structure

```text
backend/
  app/
    api/
    core/
    models/
    services/
    utils/
    main.py
  logs/
  uploads/
  tests/
  requirements.txt
  .env.example
  README.md
  .gitignore
```

## Tests

```bash
pytest
```
