import asyncio
from datetime import datetime
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models import AccessLink
from app.core.storage import delete_document_asset

async def cleanup_expired_links_task():
    """
    Background task that periodically checks for expired links or links that reached max views.
    It revokes them and deletes the underlying document asset if no other active links exist.
    """
    while True:
        try:
            db = SessionLocal()
            now = datetime.utcnow()
            
            # Find links that should be revoked but aren't yet
            # 1. Expired links
            # 2. Max views reached
            expired_links = db.query(AccessLink).filter(
                AccessLink.is_revoked == False,
                (AccessLink.expires_at < now) | (AccessLink.current_views >= AccessLink.max_views)
            ).all()
            
            for link in expired_links:
                print(f"Auto-revoking link {link.token} (Reason: {'Expired' if link.expires_at < now else 'Max Views'})")
                
                # Check if other active links use the same document
                active_sibling_links = (
                    db.query(AccessLink)
                    .filter(
                        AccessLink.document_id == link.document_id,
                        AccessLink.id != link.id,
                        AccessLink.is_revoked == False,
                    )
                    .count()
                )
                
                if active_sibling_links == 0 and link.document:
                    print(f"Deleting asset for link {link.token}: {link.document.file_path}")
                    delete_document_asset(link.document.file_path)
                
                link.is_revoked = True
                db.commit()
                
            db.close()
        except Exception as e:
            print(f"Error in cleanup background task: {e}")
        
        # Wait for 60 seconds before next check
        await asyncio.sleep(60)
