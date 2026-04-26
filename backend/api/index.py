from mangum import Mangum
import sys
import os
import traceback

# Ensure the backend directory is in the path
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

# Import with error handling
try:
    from app.main import app as fastapi_app
    print("✓ Successfully imported app.main")
except Exception as e:
    print(f"✗ Failed to import app.main: {e}")
    traceback.print_exc()
    raise

# Export handler for Vercel
handler = Mangum(fastapi_app, lifespan="off")
print("✓ Handler initialized successfully")
