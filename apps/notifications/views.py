"""
API: list notifications for current user, mark as read, unread count.
"""
from django.http import JsonResponse
from django.utils import timezone
from django.views.decorators.http import require_GET, require_http_methods

from .models import Notification


def _require_auth(request):
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Требуется авторизация."}, status=401)
    return None


@require_GET
def notification_list(request):
    """
    GET /api/notifications/
    List notifications for current user. Optional: ?limit=20
    """
    err = _require_auth(request)
    if err:
        return err
    limit = min(int(request.GET.get("limit", 50)), 100)
    qs = Notification.objects.filter(user=request.user).order_by("-created_at")[:limit]
    results = [
        {
            "id": n.pk,
            "title": n.title,
            "message": n.message,
            "type": n.type,
            "link": n.link or "",
            "is_read": n.is_read,
            "created_at": n.created_at.isoformat() if n.created_at else None,
        }
        for n in qs
    ]
    return JsonResponse({"results": results})


@require_GET
def notification_unread_count(request):
    """
    GET /api/notifications/unread-count/
    Returns { "count": N } for navbar badge.
    """
    err = _require_auth(request)
    if err:
        return err
    count = Notification.objects.filter(user=request.user, is_read=False).count()
    return JsonResponse({"count": count})


@require_http_methods(["POST", "PATCH"])
def notification_mark_read(request, pk):
    """
    POST/PATCH /api/notifications/<id>/read/
    Mark one notification as read.
    """
    err = _require_auth(request)
    if err:
        return err
    n = Notification.objects.filter(user=request.user, pk=pk).first()
    if not n:
        return JsonResponse({"error": "Не найдено."}, status=404)
    n.is_read = True
    n.read_at = timezone.now()
    n.save(update_fields=["is_read", "read_at"])
    return JsonResponse({"success": True})


@require_http_methods(["POST"])
def notification_mark_all_read(request):
    """
    POST /api/notifications/mark-all-read/
    Mark all notifications of current user as read.
    """
    err = _require_auth(request)
    if err:
        return err
    updated = Notification.objects.filter(user=request.user, is_read=False).update(
        is_read=True, read_at=timezone.now()
    )
    return JsonResponse({"success": True, "updated": updated})
