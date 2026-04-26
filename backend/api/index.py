import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from mangum import Mangum
from app.main import app

# Vercel serverless handler
handler = Mangum(app, lifespan="off")
