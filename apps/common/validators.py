from __future__ import annotations

from django.core.exceptions import ValidationError

PDF_MAX_BYTES = 5 * 1024 * 1024
IMAGE_MAX_BYTES = 5 * 1024 * 1024
PDF_HEADER = b"%PDF"


def validate_pdf_upload(upload, *, max_bytes: int = PDF_MAX_BYTES) -> None:
    if upload.size > max_bytes:
        raise ValidationError(f"File is too large. Maximum size is {max_bytes // (1024 * 1024)} MB.")

    name = (getattr(upload, "name", "") or "").lower()
    if not name.endswith(".pdf"):
        raise ValidationError("Only PDF files are allowed.")

    head = upload.read(len(PDF_HEADER))
    if hasattr(upload, "seek"):
        upload.seek(0)
    if not head.startswith(PDF_HEADER):
        raise ValidationError("Uploaded file content is not a valid PDF.")


def validate_image_upload(upload, *, max_bytes: int = IMAGE_MAX_BYTES) -> None:
    if upload.size > max_bytes:
        raise ValidationError(f"Image is too large. Maximum size is {max_bytes // (1024 * 1024)} MB.")

    content_type = (getattr(upload, "content_type", "") or "").lower()
    if content_type not in {"image/jpeg", "image/png", "image/webp", "image/gif"}:
        raise ValidationError("Only JPEG, PNG, WebP, and GIF images are allowed.")
