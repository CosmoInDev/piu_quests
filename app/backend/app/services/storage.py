from fastapi import UploadFile

from app.core.config import settings


async def upload_photo(file: UploadFile, user_id: int, quest_id: int, chart_id: int) -> str:
    """Upload a photo to Supabase Storage and return the public URL."""
    if not settings.supabase_url or not settings.supabase_service_key:
        raise RuntimeError("Supabase credentials are not configured")

    from supabase import create_client

    client = create_client(settings.supabase_url, settings.supabase_service_key)

    file_bytes = await file.read()
    path = f"{user_id}/{quest_id}/{chart_id}/{file.filename}"
    bucket = "photos"

    client.storage.from_(bucket).upload(path, file_bytes, {"content-type": file.content_type})

    return client.storage.from_(bucket).get_public_url(path)
