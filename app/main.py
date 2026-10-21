from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import analytics, health, prices
from app.db.database import init_db, SessionLocal
from app.services.seed import seed_if_empty


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    db = SessionLocal()
    try:
        seed_if_empty(db)
    finally:
        db.close()
    yield


app = FastAPI(
    title="EnergyFlow Market Analytics API",
    description=(
        "A portfolio project for querying and analyzing electricity market prices. "
        "The included starter records are illustrative sample data."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict this list before production deployment.
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/api/v1")
app.include_router(prices.router, prefix="/api/v1")
app.include_router(analytics.router, prefix="/api/v1")
