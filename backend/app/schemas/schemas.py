from pydantic import BaseModel
from datetime import datetime
from typing import Optional


# Document Schemas
class DocumentResponse(BaseModel):
    id: int
    file_name: str
    file_size: int
    created_at: datetime

    class Config:
        from_attributes = True


# AccessLink Schemas
class AccessLinkCreate(BaseModel):
    nda_text: str
    allowed_name: str
    max_views: int
    expires_at: datetime


class AccessLinkResponse(BaseModel):
    id: int
    token: str
    allowed_name: str
    max_views: int
    current_views: int
    is_revoked: bool
    expires_at: datetime
    created_at: datetime

    class Config:
        from_attributes = True


class AccessLinkDetailResponse(BaseModel):
    token: str
    nda_text: str
    allowed_name: str
    max_views: int
    current_views: int
    expires_at: datetime
    is_valid: bool

    class Config:
        from_attributes = True


class NDAAcceptRequest(BaseModel):
    user_name: str


class NDAAcceptResponse(BaseModel):
    success: bool
    message: str
    document_url: Optional[str] = None


class GenerateLinkRequest(BaseModel):
    nda_text: str
    allowed_name: str
    max_views: int
    expires_at: datetime


class GenerateLinkDirectRequest(BaseModel):
    file_name: str
    file_path: str
    file_size: int
    nda_text: str
    allowed_name: str
    max_views: int
    expires_at: datetime


class GenerateLinkResponse(BaseModel):
    token: str
    secure_url: str
    expires_at: datetime

    class Config:
        from_attributes = True
