from __future__ import annotations

import logging
from typing import Any

from django.http import HttpRequest

from apps.common.models import AuditEvent

logger = logging.getLogger(__name__)


def _client_ip(request: HttpRequest) -> str | None:
    forwarded = request.META.get("HTTP_X_FORWARDED_FOR", "")
    if forwarded:
        return forwarded.split(",", 1)[0].strip() or None
    return request.META.get("REMOTE_ADDR")


def record_audit_event(
    request: HttpRequest,
    action: str,
    *,
    target_type: str = "",
    target_id: str | int = "",
    metadata: dict[str, Any] | None = None,
) -> None:
    """
    Best-effort immutable audit write. Audit failures must never break user flows,
    but they are logged so operations can alert on database/storage issues.
    """

    user = getattr(request, "user", None)
    actor = user if getattr(user, "is_authenticated", False) else None
    try:
        AuditEvent.objects.create(
            actor=actor,
            action=action,
            target_type=target_type,
            target_id=str(target_id) if target_id else "",
            request_id=getattr(request, "request_id", ""),
            ip_address=_client_ip(request),
            user_agent=(request.META.get("HTTP_USER_AGENT") or "")[:1000],
            metadata=metadata or {},
        )
    except Exception:
        logger.exception("audit_event_write_failed action=%s target=%s:%s", action, target_type, target_id)
