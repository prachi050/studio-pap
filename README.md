# Studio PAP

A macOS design assistant. Aria, a small floating assistant, stays on top of whatever app you're working in. When you ask, it captures the active screen and gives a design review: one overall score, the top thing to fix, and scores for accessibility, hierarchy, typography, spacing and color. Reviews can be saved and exported as a PDF report.

Screen capture only runs when you ask for it.

## Built with

- Desktop: Electron, React, TypeScript, Vite, Tailwind CSS
- Backend: Python, FastAPI
- AI: OpenAI Responses API

## Run it locally

Backend:

```bash
cd backend
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload
```

Add your own OpenAI API key to `backend/.env`.

Desktop app, in a second terminal:

```bash
cd desktop
npm install
npm run dev
```

## About

Designed and built by Prachi Patel. Portfolio: [prachipatel.dev](https://prachipatel.dev)
