from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.core.config import CORS_ORIGINS, API_TITLE, API_VERSION, DATABASE_URL
from app.core.database import Base, engine
from app.routers import admin, viewer

# Only create database tables if using PostgreSQL (not SQLite in serverless)
if DATABASE_URL and not DATABASE_URL.startswith("sqlite"):
    try:
        Base.metadata.create_all(bind=engine)
    except Exception as e:
        print(f"Warning: Could not create database tables: {e}")
else:
    print(f"Skipping table creation. DATABASE_URL: {DATABASE_URL[:50] if DATABASE_URL else 'Not set'}...")

# Initialize FastAPI app
app = FastAPI(
    title=API_TITLE,
    version=API_VERSION,
    description="Secure Virtual Data Room (VDR) API"
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
