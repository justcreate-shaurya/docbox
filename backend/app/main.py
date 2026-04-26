from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.core.config import CORS_ORIGINS, API_TITLE, API_VERSION, DATABASE_URL
from app.core.database import Base, engine
from app.routers import admin, viewer

# Create database tables
try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    print(f"Warning: Could not create database tables: {e}")

from contextlib import asynccontextmanager
from app.tasks import cleanup_expired_links_task
import asyncio

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Start background cleanup task
    cleanup_task = asyncio.create_task(cleanup_expired_links_task())
    yield
    # Cleanup task will be cancelled when app shuts down
    cleanup_task.cancel()

# Initialize FastAPI app
app = FastAPI(
    title=API_TITLE,
    version=API_VERSION,
    description="Secure Virtual Data Room API",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(admin.router)
app.include_router(viewer.router)

# Mount uploads directory
if os.path.exists("./uploads"):
    app.mount("/uploads", StaticFiles(directory="./uploads"), name="uploads")


@app.get("/favicon.ico")
async def favicon():
    """Return a minimal favicon to prevent 404s"""
    return {"status": "ok"}


@app.get("/health")
def health_check():
    return {"status": "ok", "version": API_VERSION}


@app.get("/")
def root():
    return {
        "message": "Welcome to VDR API",
        "version": API_VERSION,
        "docs": "/docs"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
