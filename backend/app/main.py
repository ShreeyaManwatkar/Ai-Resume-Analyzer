from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine
from app.models.base import Base
# Import models to ensure they are registered with Base
from app.models.user import User
from app.models.resume import Resume
from app.models.job import Job
from app.models.report import Report

from app.api.router import api_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan event handler.
    Automatically creates all database tables on server startup.
    """
    # Create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    # Shutdown logic (if any) can go here

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

# Set up CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Router
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/", tags=["Health"])
async def root():
    return {
        "status": "healthy",
        "message": f"Welcome to the {settings.PROJECT_NAME} API"
    }

