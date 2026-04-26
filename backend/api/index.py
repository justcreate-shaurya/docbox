from mangum import Mangum
import sys
import os

# Ensure the backend directory is in the path
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

# Now import the app
from app.main import app as fastapi_app

# Export handler for Vercel
handler = Mangum(fastapi_app, lifespan="off")
