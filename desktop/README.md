# Studio PAP Desktop

Electron + React + TypeScript desktop client for Studio PAP.

## Stack

- Electron
- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Axios
- ESLint
- Prettier

## Backend

The reusable Axios client points to:

```text
http://127.0.0.1:8000
```

The Home page checks:

```text
GET /
```

## Screen Capture Foundation

The Screen Capture page performs a single user-triggered capture of the primary display through
Electron IPC and `desktopCapturer`.

After a successful capture, the renderer automatically uploads the screenshot to:

```text
POST http://127.0.0.1:8000/screen/upload
```

This foundation does not include OCR, AI, OpenAI calls, background capture, or continuous capture.

## Setup

```bash
cd desktop
npm install
```

## Run In Development

Make sure the FastAPI backend is running at `http://127.0.0.1:8000`, then start the desktop app:

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Project Structure

```text
desktop/
  electron/
    main.ts
    preload.ts
  src/
    components/
    pages/
    hooks/
    services/
    assets/
    styles/
    App.tsx
    main.tsx
  public/
  package.json
  tsconfig.json
  vite.config.ts
  tailwind.config.js
  postcss.config.js
  README.md
  .gitignore
```
