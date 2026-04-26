from fastapi import APIRouter, Depends, File, UploadFile, Form, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
import os
from uuid import uuid4

from app.core.database import get_db
from app.core.security import generate_secure_token
from app.core.config import UPLOAD_DIR, ADMIN_USERNAME, ADMIN_PASSWORD, SUPABASE_URL, SUPABASE_KEY, SUPABASE_BUCKET
from app.models import Document, AccessLink
from app.schemas.schemas import GenerateLinkDirectRequest, GenerateLinkResponse, AccessLinkResponse
from app.core.security import create_access_token, get_current_admin
from app.core.storage import delete_document_asset
from fastapi.security import OAuth2PasswordRequestForm

router = APIRouter(prefix="/api/admin", tags=["admin"])




def _create_link_record(
    db: Session,
    file_name: str,
    file_path: str,
    file_size: int,
    nda_text: str,
    allowed_name: str,
    max_views: int,
    expires_at_dt: datetime,
) -> GenerateLinkResponse:
    document = Document(
        file_name=file_name,
        file_path=file_path,
        file_size=file_size,
    )
    db.add(document)
    db.flush()

    token = generate_secure_token()
    access_link = AccessLink(
        token=token,
        document_id=document.id,
        nda_text=nda_text,
        allowed_name=allowed_name,
        max_views=max_views,
        expires_at=expires_at_dt,
    )
    db.add(access_link)
    db.commit()
    db.refresh(access_link)

    secure_url = f"/secure/{token}"
    return GenerateLinkResponse(
        token=token,
        secure_url=secure_url,
        expires_at=access_link.expires_at,
    )


@router.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    if form_data.username != ADMIN_USERNAME or form_data.password != ADMIN_PASSWORD:
        raise HTTPException(status_code=400, detail="Incorrect username or password")

    access_token = create_access_token(data={"sub": ADMIN_USERNAME})
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/generate-link")
async def generate_link(
    file: UploadFile = File(...),
    nda_text: str = Form(...),
    allowed_name: str = Form(...),
    max_views: int = Form(...),
    expires_at: str = Form(...),
    db: Session = Depends(get_db),
    admin: str = Depends(get_current_admin)
):
    """
    Generate a secure document link with NDA.
    Uploads file to Supabase Storage if configured, otherwise local disk.
    """
    try:
        # Parse expiration datetime
        expires_at_dt = datetime.fromisoformat(expires_at)

        # Generate unique filename
        file_extension = os.path.splitext(file.filename)[1]
        unique_filename = f"{uuid4()}{file_extension}"
        file_contents = await file.read()
        file_size = len(file_contents)

        if SUPABASE_URL and SUPABASE_KEY:
            # Upload to Supabase Storage
            from supabase import create_client  # type: ignore[import-not-found]
            sb = create_client(SUPABASE_URL, SUPABASE_KEY)
            storage_path = f"uploads/{unique_filename}"
            sb.storage.from_(SUPABASE_BUCKET).upload(
                path=storage_path,
                file=file_contents,
                file_options={"content-type": "application/pdf"}
            )
            # Store the storage path as file_path (prefixed to identify storage type)
            file_path = f"supabase://{storage_path}"
        else:
            # Fallback: save to local disk
            import shutil, io
            os.makedirs(UPLOAD_DIR, exist_ok=True)
            local_path = os.path.join(UPLOAD_DIR, unique_filename)
            with open(local_path, "wb") as buffer:
                buffer.write(file_contents)
            file_path = local_path

        return _create_link_record(
            db=db,
            file_name=file.filename,
            file_path=file_path,
            file_size=file_size,
            nda_text=nda_text,
            allowed_name=allowed_name,
            max_views=max_views,
            expires_at_dt=expires_at_dt,
        )

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/generate-link-direct")
async def generate_link_direct(
    payload: GenerateLinkDirectRequest,
    db: Session = Depends(get_db),
    admin: str = Depends(get_current_admin),
):
    """
    Generate a secure document link using an already-uploaded file path.
    This avoids large multipart payloads through the API.
    """
    try:
        expires_at_dt = payload.expires_at
        if isinstance(expires_at_dt, str):
            expires_at_dt = datetime.fromisoformat(expires_at_dt.replace("Z", "+00:00"))

        if not payload.file_path:
            raise HTTPException(status_code=400, detail="file_path is required")

        return _create_link_record(
            db=db,
            file_name=payload.file_name,
            file_path=payload.file_path,
            file_size=payload.file_size,
            nda_text=payload.nda_text,
            allowed_name=payload.allowed_name,
            max_views=payload.max_views,
            expires_at_dt=expires_at_dt,
        )
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/links")
async def get_all_links(db: Session = Depends(get_db), admin: str = Depends(get_current_admin)):
    """
    Get all generated access links for the admin dashboard.
    """
    links = db.query(AccessLink).order_by(AccessLink.created_at.asc()).all()

    result = []
    for link in links:
        is_expired = link.expires_at < datetime.utcnow()
        is_max_views_reached = link.current_views >= link.max_views

        result.append({
            **AccessLinkResponse.from_orm(link).dict(),
            "status": "Revoked" if link.is_revoked else "Expired" if is_expired else "Active",
            "document_name": link.document.file_name
        })

    return result


@router.post("/links/{link_id}/revoke")
async def revoke_link(link_id: int, db: Session = Depends(get_db), admin: str = Depends(get_current_admin)):
    """
    Revoke access to a document link.
    """
    link = db.query(AccessLink).filter(AccessLink.id == link_id).first()

    if not link:
        raise HTTPException(status_code=404, detail="Link not found")

    if link.is_revoked:
        return {"message": "Link already revoked"}

    try:
        # Only delete the underlying asset when no other active links use this document.
        active_sibling_links = (
            db.query(AccessLink)
            .filter(
                AccessLink.document_id == link.document_id,
                AccessLink.id != link.id,
                AccessLink.is_revoked == False,
            )
            .count()
        )

        print(f"DEBUG: Revoking link {link_id}. Active sibling links: {active_sibling_links}")

        if active_sibling_links == 0 and link.document:
            print(f"DEBUG: Last active link for document {link.document_id} revoked. Deleting asset: {link.document.file_path}")
            delete_document_asset(link.document.file_path)
        elif active_sibling_links > 0:
            print(f"DEBUG: Skipping asset deletion because {active_sibling_links} active sibling links remain.")
        elif not link.document:
            print("DEBUG: link.document is None, cannot delete asset.")

        link.is_revoked = True
        db.commit()
        return {"message": "Link revoked and file deleted successfully" if (active_sibling_links == 0 and link.document) else "Link revoked successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/links/{link_id}")
async def delete_link(link_id: int, db: Session = Depends(get_db), admin: str = Depends(get_current_admin)):
    """
    Delete an access link record from the database.
    """
    link = db.query(AccessLink).filter(AccessLink.id == link_id).first()

    if not link:
        raise HTTPException(status_code=404, detail="Link not found")

    try:
        # If not revoked, perform the same cleanup logic as revoke
        if not link.is_revoked:
            active_sibling_links = (
                db.query(AccessLink)
                .filter(
                    AccessLink.document_id == link.document_id,
                    AccessLink.id != link.id,
                    AccessLink.is_revoked == False,
                )
                .count()
            )

            print(f"DEBUG: Deleting link {link_id} (not revoked yet). Active sibling links: {active_sibling_links}")

            if active_sibling_links == 0 and link.document:
                print(f"DEBUG: Last active link for document {link.document_id} being deleted. Deleting asset: {link.document.file_path}")
                delete_document_asset(link.document.file_path)
        else:
            print(f"DEBUG: Deleting link {link_id} (already revoked). Asset should have been deleted during revocation.")

        db.delete(link)
        db.commit()
        return {"message": "Link deleted successfully"}

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
