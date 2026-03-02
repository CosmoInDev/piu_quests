# PIU Quests — Project Guidelines

## Project Overview

Full-stack web app for ~30 friends to track Pump It Up rhythm game records.
App title: **망겜기록제출소**

## Tech Stack

| Layer     | Technology                                          |
|-----------|-----------------------------------------------------|
| Frontend  | Next.js 16 (App Router) + TypeScript + Tailwind v4 + shadcn/ui |
| Backend   | FastAPI + Python 3.11 + SQLAlchemy 2.0 (async)      |
| Auth      | NextAuth.js v4 (Google OAuth2) — JWT forwarded to FastAPI |
| Database  | Supabase PostgreSQL                                 |
| Storage   | Supabase Storage                                    |
| Deploy    | Vercel (frontend) + Render (backend)                |

## Key Paths

- Frontend: `app/frontend/`
- Backend: `app/backend/`
- Design specs: `specs/`

## UI / Localization

- **All users are Korean.** Every user-facing string must be in Korean.
- This applies to: labels, buttons, placeholders, error messages, empty states, tooltips, and any visible text — including placeholder/WIP pages.
- App title is **망겜기록제출소** everywhere (page title, navbar, etc.).

## Design Principles

- Follow the responsive style of [piurank.com](https://piurank.com): wide layout for PC, sidebar for mobile.
- PC: top horizontal navigation bar.
- Mobile: hamburger icon on the **left** → sidebar slides in from the **left**.
- Home page (`/`) shows the same content as the ongoing quest page (`/quests/ongoing`).

## Git Workflow

- Use **gitflow**: create `feature/<name>` branches from `main`, open a PR, squash-merge, then delete the branch.
- Use the `/git-start-feature` skill to start a new feature branch.
- Use the `/git-make-pr` skill to commit, push, and open a PR.
- Never commit directly to `main`.
- Never commit `.env`, `.env.local`, or any file containing secrets.

## Backend Conventions

- Python version: 3.11
- Use `uv` for package management (run as `python -m uv`); always pass `--python python3.11` when creating a venv.
- `supabase` Python package pinned to `>=2.10.0,<2.12.0` (newer versions pull in pyiceberg which requires MSVC build tools).
- Alembic migrations use async engine (`async_engine_from_config`).
- Import `app.models.*` in `conftest.py` **before** `from app.main import app` to avoid name shadowing.

## Frontend Conventions

- Tailwind v4 — theme colors are CSS variables in `globals.css`; there is no `tailwind.config.ts`.
- shadcn/ui components are added via `npx shadcn@latest add <component>`.
- Add `suppressHydrationWarning` to `<body>` in `layout.tsx` to suppress browser-extension-caused hydration mismatches.
