"""
Kubernetes-style liveness/readiness probes (no auth, GET only).
"""
from __future__ import annotations

import logging

from django.db import connection
from django.http import JsonResponse
from django.views.decorators.http import require_GET

logger = logging.getLogger(__name__)


@require_GET
def health_live(request):
    """
    Liveness: process is up. Does not check dependencies.
    """
    return JsonResponse({"status": "ok", "check": "live"})


@require_GET
def health_ready(request):
    """
    Readiness: default database is reachable.
    """
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()
    except Exception:
        logger.exception("readiness database check failed")
        return JsonResponse({"status": "unavailable", "check": "ready", "database": "down"}, status=503)
    return JsonResponse({"status": "ok", "check": "ready", "database": "ok"})
