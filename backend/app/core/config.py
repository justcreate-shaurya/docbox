import os
from datetime import timedelta

# JWT/Security
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Admin Auth
ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "supersecret")

# Supabase Storage
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")
SUPABASE_BUCKET = os.getenv("SUPABASE_BUCKET", "documents")

# File Upload (fallback for local dev)
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "./uploads")
MAX_UPLOAD_SIZE = 100 * 1024 * 1024  # 100MB

# CORS
cors_origins_str = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:8000")
CORS_ORIGINS = [origin.strip() for origin in cors_origins_str.split(",")]
print(f"CORS Origins configured: {CORS_ORIGINS}")

# API
API_TITLE = "VDR API"
API_VERSION = "1.0.0"

# Ensure upload directory exists (only in local dev, not in serverless)
try:
    if not os.getenv("VERCEL"):  # Skip on Vercel
        os.makedirs(UPLOAD_DIR, exist_ok=True)
except Exception as e:
    print(f"Warning: Could not create upload directory: {e}")
