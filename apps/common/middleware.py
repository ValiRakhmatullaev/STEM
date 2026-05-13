"""
Cross-cutting HTTP middleware: request correlation for structured logs and tracing hooks.
"""
from __future__ import annotations

import logging
import time
import uuid

logger = logging.getLogger("django.request")


class RequestIdMiddleware:
    """
    Assigns X-Request-ID (echo inbound header or generate UUID) for log correlation.
    """

    HEADER = "HTTP_X_REQUEST_ID"
    OUT_HEADER = "X-Request-ID"

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        rid = request.META.get(self.HEADER) or str(uuid.uuid4())
        if len(rid) > 128:
            rid = str(uuid.uuid4())
        request.request_id = rid
        started = time.perf_counter()
        response = self.get_response(request)
        elapsed_ms = round((time.perf_counter() - started) * 1000, 2)
        response[self.OUT_HEADER] = rid
        response["Server-Timing"] = f"app;dur={elapsed_ms}"
        logger.info(
            "request_completed",
            extra={
                "request_id": rid,
                "method": request.method,
                "path": request.path,
                "status_code": response.status_code,
                "duration_ms": elapsed_ms,
            },
        )
        return response


class SecurityHeadersMiddleware:
    """
    Adds baseline security headers at the application layer (edge / CDN may duplicate).
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        # Do not set CSP here — requires asset/hash audit per deployment.
        response.setdefault("X-Content-Type-Options", "nosniff")
        response.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
        response.setdefault("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
        response.setdefault("Cross-Origin-Opener-Policy", "same-origin")
        response.setdefault("X-Permitted-Cross-Domain-Policies", "none")
        script_src = "script-src 'self' 'unsafe-inline'; " if request.path.startswith("/checkins-simple/") else "script-src 'self'; "
        response.setdefault(
            "Content-Security-Policy",
            "default-src 'self'; "
            "base-uri 'self'; "
            "object-src 'none'; "
            "frame-ancestors 'none'; "
            "img-src 'self' data: blob:; "
            "font-src 'self' data:; "
            "style-src 'self' 'unsafe-inline'; "
            f"{script_src}"
            "connect-src 'self'; "
            "form-action 'self'; "
            "upgrade-insecure-requests",
        )
        return response
