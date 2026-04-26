import os
from app.core.config import SUPABASE_URL, SUPABASE_KEY, SUPABASE_BUCKET

def delete_document_asset(file_path: str) -> None:
    """Delete a stored document asset from Supabase or local disk."""
    if not file_path:
        return

    if file_path.startswith("supabase://"):
        if not (SUPABASE_URL and SUPABASE_KEY):
            # Log error or raise, but for background task we might want to just log
            print("Error: Supabase credentials are missing")
            return

        try:
            from supabase import create_client  # type: ignore[import-not-found]
            storage_path = file_path.replace("supabase://", "", 1)
            sb = create_client(SUPABASE_URL, SUPABASE_KEY)
            sb.storage.from_(SUPABASE_BUCKET).remove([storage_path])
        except Exception as e:
            print(f"Error deleting from Supabase: {e}")
        return

    # Local fallback path
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
    except Exception as e:
        print(f"Error deleting local file: {e}")
