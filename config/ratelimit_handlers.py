"""429 responses for django-ratelimit (JSON for API, HTML for check-in form)."""
from django.http import HttpResponse, JsonResponse


def ratelimited_error(request, exception):
    accept = (request.META.get("HTTP_ACCEPT") or "").lower()
    path = request.path or ""
    if path.startswith("/api/") or "application/json" in accept:
        return JsonResponse(
            {"message": "Слишком много запросов. Подождите и попробуйте снова."},
            status=429,
        )
    return HttpResponse(
        "<html><body><h2>429 Too Many Requests</h2><p>Подождите немного и попробуйте снова.</p></body></html>",
        status=429,
        content_type="text/html; charset=utf-8",
    )
