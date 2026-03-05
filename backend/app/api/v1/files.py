import io
import uuid

from fastapi import APIRouter, Depends, UploadFile, status
from fastapi import File as FastAPIFile
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_optional_user
from app.config import settings
from app.core.database import get_db
from app.core.errors import ChatSDKError
from app.models.file import File
from app.utils.user_id import get_user_id_uuid

router = APIRouter()


def _allowed_image_types() -> list[str]:
    types = [t.strip() for t in settings.ALLOWED_UPLOAD_IMAGE_TYPES.split(",") if t.strip()]
    return types if types else ["image/jpeg", "image/png"]


# Magic bytes for allowed image types (detect content regardless of claimed Content-Type)
_JPEG_SIGNATURE = bytes([0xFF, 0xD8, 0xFF])
_PNG_SIGNATURE = bytes([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])


def _content_matches_type(content: bytes, content_type: str) -> bool:
    """Verify file content matches claimed MIME type using magic bytes."""
    if content_type == "image/jpeg":
        return len(content) >= 3 and content[:3] == _JPEG_SIGNATURE
    if content_type == "image/png":
        return len(content) >= 8 and content[:8] == _PNG_SIGNATURE
    return False


@router.post("/upload")
async def upload_file(
    file: UploadFile = FastAPIFile(...),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Upload a file (image) to PostgreSQL storage.
    Max file size and allowed types are from settings (MAX_UPLOAD_FILE_SIZE_BYTES, ALLOWED_UPLOAD_IMAGE_TYPES).
    """
    # Validate file exists
    if not file.filename:
        raise ChatSDKError(
            "bad_request:api",
            "No file uploaded",
            status_code=status.HTTP_400_BAD_REQUEST,
        )

    # Read file content
    file_content = await file.read()

    # Validate file size
    file_size = len(file_content)
    max_size = settings.MAX_UPLOAD_FILE_SIZE_BYTES
    if file_size > max_size:
        raise ChatSDKError(
            "bad_request:api",
            f"File size should be less than {max_size // (1024 * 1024)}MB",
            status_code=status.HTTP_400_BAD_REQUEST,
        )

    # Validate file type (Content-Type header)
    allowed_types = _allowed_image_types()
    content_type = file.content_type or "application/octet-stream"
    if content_type not in allowed_types:
        raise ChatSDKError(
            "bad_request:api",
            f"File type should be one of: {', '.join(allowed_types)}",
            status_code=status.HTTP_400_BAD_REQUEST,
        )

    # Validate actual content matches claimed type (magic bytes; only JPEG/PNG supported for now)
    if not _content_matches_type(file_content, content_type):
        raise ChatSDKError(
            "bad_request:api",
            "File content does not match claimed image type",
            status_code=status.HTTP_400_BAD_REQUEST,
        )

    try:
        # Convert user_id to UUID (handles session IDs when auth is disabled)
        # get_user_id_uuid converts session IDs to deterministic UUIDs
        user_id = None
        if current_user:
            user_id_str = current_user.get("id")
            if user_id_str:
                try:
                    user_id = get_user_id_uuid(user_id_str)
                except ValueError:
                    # Invalid user ID format - set to None since File.user_id is nullable
                    user_id = None

        # Store file in PostgreSQL
        file_record = File(
            id=uuid.uuid4(),
            filename=file.filename,
            content_type=content_type,
            data=file_content,  # BYTEA column stores binary data
            size=file_size,
            user_id=user_id,
        )

        db.add(file_record)
        await db.commit()
        await db.refresh(file_record)

        # Generate URL for the file (using the file ID)
        # The frontend will need to call GET /api/files/{file_id} to retrieve it
        # Using relative URL so frontend can handle routing
        file_url = f"/api/files/{file_record.id}"

        # Return format matching Vercel Blob API response (for compatibility)
        # Frontend expects: { url, pathname, contentType }
        # - url: Used in <img src={url}> (relative URL works with Next.js Image)
        # - pathname: Used as the attachment name (should be original filename)
        # - contentType: MIME type for the file
        return {
            "url": file_url,
            "pathname": file_record.filename,  # Original filename, not UUID
            "contentType": file_record.content_type,
        }
    except Exception as e:
        await db.rollback()
        raise ChatSDKError(
            "offline:api",
            f"Upload failed: {str(e)}",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@router.get("/{file_id}")
async def get_file(
    file_id: uuid.UUID,
    current_user: dict | None = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Retrieve a file by ID from PostgreSQL storage.
    Access: owner only. If the file has no owner (user_id is null), any authenticated user may read it.
    Prevents IDOR: malicious request cannot download another user's file by guessing file ID.
    """
    try:
        result = await db.execute(select(File).where(File.id == file_id))
        file_record = result.scalar_one_or_none()

        if not file_record:
            raise ChatSDKError(
                "not_found:api",
                "File not found",
                status_code=status.HTTP_404_NOT_FOUND,
            )

        # Guardrail: enforce ownership so file_id cannot be used to bypass and read another user's file
        if file_record.user_id is not None:
            if not current_user:
                raise ChatSDKError(
                    "forbidden:api",
                    "Authentication required to access this file",
                    status_code=status.HTTP_403_FORBIDDEN,
                )
            current_user_id = get_user_id_uuid(current_user["id"])
            if file_record.user_id != current_user_id:
                raise ChatSDKError(
                    "forbidden:api",
                    "You do not have access to this file",
                    status_code=status.HTTP_403_FORBIDDEN,
                )

        # Return file as streaming response (chunked for better memory efficiency)
        # Create a BytesIO object from the file data
        file_stream = io.BytesIO(bytes(file_record.data))

        async def generate():
            # Read and yield file in chunks (64KB at a time)
            chunk_size = 64 * 1024  # 64KB chunks
            while True:
                chunk = file_stream.read(chunk_size)
                if not chunk:
                    break
                yield chunk

        return StreamingResponse(
            generate(),
            media_type=file_record.content_type,
            headers={
                "Content-Disposition": f'inline; filename="{file_record.filename}"',
                "Content-Length": str(file_record.size),
            },
        )
    except ChatSDKError:
        raise
    except Exception as e:
        raise ChatSDKError(
            "offline:api",
            f"Failed to retrieve file: {str(e)}",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
