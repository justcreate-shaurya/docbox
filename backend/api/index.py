import sys
import os

print("=== STARTING API HANDLER ===")
print(f"Python version: {sys.version}")
print(f"Working directory: {os.getcwd()}")

try:
    print("1. Importing mangum...")
    from mangum import Mangum
    print("✓ Mangum imported")
    
    print("2. Importing app.main...")
    from app.main import app
    print("✓ app.main imported")
    
    print("3. Creating handler...")
    handler = Mangum(app, lifespan="off")
    print("✓ Handler created successfully")
    
except Exception as e:
    print(f"✗ ERROR: {e}")
    import traceback
    traceback.print_exc()
    raise
