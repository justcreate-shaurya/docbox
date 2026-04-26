from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse, StreamingResponse, RedirectResponse
from sqlalchemy.orm import Session
from datetime import datetime
import io

from app.core.database import get_db
from app.models import AccessLink, Document
from app.schemas.schemas import NDAAcceptRequest, NDAAcceptResponse, AccessLinkDetailResponse
from app.core.config import SUPABASE_URL, SUPABASE_KEY, SUPABASE_BUCKET
from app.core.storage import delete_document_asset

router = APIRouter(prefix="/api/viewer", tags=["viewer"])
 
 
def _check_and_auto_revoke(link: AccessLink, db: Session) -> bool:
    """
    Checks if a link should be revoked (expired or max views).
    If so, revokes it and deletes the document asset if no other active links exist.
    Returns True if the link was revoked.
    """
    if link.is_revoked:
        return True
        
    now = datetime.utcnow()
    is_expired = link.expires_at < now
    # Use strictly greater than so the N-th view is still allowed to fetch the document
    # but the (N+1)-th session will be blocked.
    is_max_views = link.current_views > link.max_views
    
    if is_expired or is_max_views:
        # Only delete asset if no other active sibling links
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
            delete_document_asset(link.document.file_path)
            
        link.is_revoked = True
        db.commit()
        return True
        
    return False



@router.get("/verify-link/{token}", response_model=AccessLinkDetailResponse)
async def verify_link(token: str, db: Session = Depends(get_db)):
    """
    Verify if a token is valid and return NDA text + allowed name.
    """
    link = db.query(AccessLink).filter(AccessLink.token == token).first()

    if not link:
        raise HTTPException(status_code=404, detail="Link not found")

    if _check_and_auto_revoke(link, db):
        raise HTTPException(status_code=403, detail="This link has expired or reached maximum views")

    return AccessLinkDetailResponse(
        token=link.token,
        nda_text=link.nda_text,
        allowed_name=link.allowed_name,
        max_views=link.max_views,
        current_views=link.current_views,
        expires_at=link.expires_at,
        is_valid=True
    )


@router.post("/accept-nda/{token}")
async def accept_nda(token: str, request: NDAAcceptRequest, db: Session = Depends(get_db)):
    """
    Accept NDA and verify user name to get document access.
    """
    link = db.query(AccessLink).filter(AccessLink.token == token).first()

    if not link:
        raise HTTPException(status_code=404, detail="Link not found")

    if request.user_name.strip().lower() != link.allowed_name.strip().lower():
        raise HTTPException(status_code=403, detail="Name does not match")

    if _check_and_auto_revoke(link, db):
        raise HTTPException(status_code=403, detail="This link has expired or reached maximum views")

    link.current_views += 1
    db.commit()

    document_url = f"/api/viewer/document/{token}"

    return NDAAcceptResponse(
        success=True,
        message="NDA accepted successfully",
        document_url=document_url
    )


@router.get("/document/{token}")
async def get_document(token: str, db: Session = Depends(get_db)):
    """
    Stream the PDF document to the viewer.
    Serves from Supabase Storage or local disk based on file_path prefix.
    """
    link = db.query(AccessLink).filter(AccessLink.token == token).first()

    if not link:
        raise HTTPException(status_code=404, detail="Link not found")

    if _check_and_auto_revoke(link, db):
        raise HTTPException(status_code=403, detail="Access denied")

    document = link.document
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    if document.file_path.startswith("supabase://"):
        # Serve from Supabase Storage via signed URL
        if not SUPABASE_URL or not SUPABASE_KEY:
            raise HTTPException(status_code=500, detail="Storage not configured")

        from supabase import create_client
        sb = create_client(SUPABASE_URL, SUPABASE_KEY)
        storage_path = document.file_path.replace("supabase://", "")

        # Create a signed URL valid for 60 seconds
        signed = sb.storage.from_(SUPABASE_BUCKET).create_signed_url(storage_path, 60)
        signed_url = signed.get("signedURL") or signed.get("signedUrl")

        if not signed_url:
            raise HTTPException(status_code=500, detail="Could not generate file URL")

        return RedirectResponse(url=signed_url)
    else:
        # Serve from local disk
        return FileResponse(
            path=document.file_path,
            media_type="application/pdf",
            filename=document.file_name
        )
