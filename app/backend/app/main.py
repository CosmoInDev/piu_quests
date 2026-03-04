from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import app.models  # noqa: F401 — registers all ORM models before any mapper is used
from app.core.config import settings
from app.routers import users, quests, records, photos

app = FastAPI(title="PIU Quests API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.cors_origins.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router)
app.include_router(quests.router)
app.include_router(records.router)
app.include_router(photos.router)


@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}
