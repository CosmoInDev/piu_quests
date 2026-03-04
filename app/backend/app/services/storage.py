import uuid
from urllib.parse import urlparse

from fastapi import UploadFile

from app.core.config import settings

BUCKET = "photos"


def _get_client():
    if not settings.supabase_url or not settings.supabase_service_key:
        raise RuntimeError("Supabase credentials are not configured")
    from supabase import create_client
    return create_client(settings.supabase_url, settings.supabase_service_key)


async def upload_photo(file: UploadFile, user_id: int, quest_id: int) -> str:
    """Upload a photo to Supabase Storage and return the public URL."""
    client = _get_client()

    file_bytes = await file.read()
    ext = file.filename.rsplit(".", 1)[-1] if file.filename and "." in file.filename else "jpg"
    unique_name = f"{uuid.uuid4().hex}.{ext}"
    path = f"{user_id}/{quest_id}/{unique_name}"

    client.storage.from_(BUCKET).upload(path, file_bytes, {"content-type": file.content_type})

    return client.storage.from_(BUCKET).get_public_url(path)


async def upload_photo_bytes(
    file_bytes: bytes, content_type: str, filename: str, user_id: int, quest_id: int
) -> str:
    """Upload raw bytes to Supabase Storage and return the public URL."""
    client = _get_client()

    ext = filename.rsplit(".", 1)[-1] if filename and "." in filename else "jpg"
    unique_name = f"{uuid.uuid4().hex}.{ext}"
    path = f"{user_id}/{quest_id}/{unique_name}"

    client.storage.from_(BUCKET).upload(path, file_bytes, {"content-type": content_type})

    return client.storage.from_(BUCKET).get_public_url(path)


async def delete_photo_file(file_url: str) -> None:
    """Delete a photo file from Supabase Storage by its public URL."""
    client = _get_client()

    parsed = urlparse(file_url)
    # Public URL path format: /storage/v1/object/public/photos/<path>
    path_parts = parsed.path.split(f"/storage/v1/object/public/{BUCKET}/")
    if len(path_parts) < 2:
        return
    storage_path = path_parts[1]

    client.storage.from_(BUCKET).remove([storage_path])
