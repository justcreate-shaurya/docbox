from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
import traceback

print("=== INITIALIZING FASTAPI APP ===")

try:
    print("1. Loading config...")
    from app.core.config import CORS_ORIGINS, API_TITLE, API_VERSION, DATABASE_URL
    print(f"✓ Config loaded. DB URL set: {bool(DATABASE_URL)}")
except Exception as e:
    print(f"✗ Failed to load config: {e}")
    traceback.print_exc()
    raise

try:
    print("2. Loading database...")
    from app.core.database import Base, engine
    print("✓ Database module loaded")
except Exception as e:
    print(f"✗ Failed to load database: {e}")
    traceback.print_exc()
    raise

try:
    print("3. Loading routers...")
    from app.routers import admin, viewer
    print("✓ Routers loaded")
except Exception as e:
    print(f"✗ Failed to load routers: {e}")
    traceback.print_exc()
    raise

# Only create database tables if using PostgreSQL
if DATABASE_URL and not DATABASE_URL.startswith("sqlite"):
    try:
        print("4. Creating database tables...")
        Base.metadata.create_all(bind=engine)
        print("✓ Database tables created")
    except Exception as e:
        print(f"⚠ Warning: Could not create database tables: {e}")
else:
    print(f"4. Skipping table creation (using SQLite or no DB configured)")

try:
    print("5. Creating FastAPI app...")
    app = FastAPI(
        title=API_TITLE,
        version=API_VERSION,
        description="Secure Virtual Data Room (VDR) API"
    )
    print(f"✓ FastAPI app created with CORS: {CORS_ORIGINS}")
except Exception as e:
    print(f"✗ Failed to create FastAPI app: {e}")
    traceback.print_exc()
    raise

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
