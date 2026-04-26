import sys
import os

print("=== STARTING API HANDLER ===")

# Create a fallback handler in case imports fail
async def fallback_app(scope, receive, send):
    await send({
        'type': 'http.response.start',
        'status': 500,
        'headers': [[b'content-type', b'application/json']],
    })
    await send({
        'type': 'http.response.body',
        'body': b'{"error": "Application failed to initialize"}',
    })

from mangum import Mangum
handler = Mangum(fallback_app, lifespan="off")

try:
    print("Importing app.main...")
    from app.main import app
    print("✓ Successfully imported app.main")
    handler = Mangum(app, lifespan="off")
    print("✓ Handler ready")
except Exception as e:
    print(f"✗ ERROR during import: {e}")
    import traceback
    traceback.print_exc()
    # Handler stays as fallback
