import os
from app.core.config import SUPABASE_URL, SUPABASE_KEY, SUPABASE_BUCKET

def delete_document_asset(file_path: str) -> None:
    """Delete a stored document asset from Supabase or local disk."""
    if not file_path:
        print("DEBUG: No file_path provided to delete_document_asset")
        return

    print(f"DEBUG: Attempting to delete asset at {file_path}")

    if file_path.startswith("supabase://"):
        if not (SUPABASE_URL and SUPABASE_KEY):
            print("Error: Supabase credentials (URL or KEY) are missing in config")
            return

        try:
            from supabase import create_client  # type: ignore[import-not-found]
            storage_path = file_path.replace("supabase://", "", 1)
            print(f"DEBUG: Supabase storage path to remove: {storage_path} (Bucket: {SUPABASE_BUCKET})")
            
            sb = create_client(SUPABASE_URL, SUPABASE_KEY)
            response = sb.storage.from_(SUPABASE_BUCKET).remove([storage_path])
            
            # Check for errors in the response (Supabase-py returns a list of objects or an error response)
            print(f"DEBUG: Supabase remove response: {response}")
            
        except Exception as e:
            print(f"Error deleting from Supabase: {str(e)}")
            import traceback
            traceback.print_exc()
        return

    # Local fallback path
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
            print(f"DEBUG: Deleted local file: {file_path}")
        else:
            print(f"DEBUG: Local file not found for deletion: {file_path}")
    except Exception as e:
        print(f"Error deleting local file: {e}")
