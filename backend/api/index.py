import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from mangum import Mangum
    from app.main import app
    handler = Mangum(app, lifespan="off")
except ImportError as e:
    print(f"Import error: {e}")
    raise
