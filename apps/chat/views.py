"""
Chat & Interview API.
Endpoints are mounted at /api/chat/.
"""
import json

from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.views.decorators.http import require_GET, require_http_methods

from .models import (
    ChatRoom,
    ChatMessage,
    InterviewInvite,
    InterviewFormat,
    InterviewStatus,
)


# ─── helpers ───────────────────────────────────────────────

def _user_room(request, room_id):
    """Return (room, error_response). User must be company_user or candidate."""
    if not request.user.is_authenticated:
        return None, JsonResponse({"error": "Требуется авторизация."}, status=401)
    room = get_object_or_404(ChatRoom, pk=room_id, is_active=True)
    if request.user.pk not in (room.company_user_id, room.candidate_id):
        return None, JsonResponse({"error": "Нет доступа к этому чату."}, status=403)
    return room, None


def _serialize_message(msg):
    return {
        "id": msg.pk,
        "sender_id": msg.sender_id,
        "text": msg.text,
        "is_read": msg.is_read,
        "created_at": msg.created_at.isoformat() if msg.created_at else None,
    }


def _serialize_interview(inv):
    return {
        "id": inv.pk,
        "room_id": inv.room_id,
        "scheduled_at": inv.scheduled_at.isoformat() if inv.scheduled_at else None,
        "duration_minutes": inv.duration_minutes,
        "format": inv.format,
        "location": inv.location,
        "note": inv.note,
        "status": inv.status,
        "candidate_comment": inv.candidate_comment,
        "created_at": inv.created_at.isoformat() if inv.created_at else None,
    }


def _serialize_room(room, request_user):
    other = room.candidate if request_user.pk == room.company_user_id else room.company_user
    unread = ChatMessage.objects.filter(room=room, is_read=False).exclude(sender=request_user).count()
    last_msg = room.messages.order_by("-created_at").first()
    upcoming_interview = room.interviews.filter(
        status__in=[InterviewStatus.PENDING, InterviewStatus.ACCEPTED]
    ).order_by("scheduled_at").first()
    return {
        "id": room.pk,
        "application_id": room.application_id,
        "job_title": room.application.job.title,
        "other_user": {
            "id": other.pk,
            "full_name": other.get_full_name() or getattr(other, "display_name", "") or other.username,
            "profile_photo": request_user and (other.profile_photo.url if other.profile_photo else None),
        },
        "unread_count": unread,
        "last_message": _serialize_message(last_msg) if last_msg else None,
        "interview": _serialize_interview(upcoming_interview) if upcoming_interview else None,
        "created_at": room.created_at.isoformat() if room.created_at else None,
    }


# ─── Chat rooms list ──────────────────────────────────────

@require_GET
def chat_rooms(request):
    """
    GET /api/chat/rooms/
    List all active chat rooms for the current user (company or candidate).
    """
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Требуется авторизация."}, status=401)

    from django.db.models import Q
    rooms = (
        ChatRoom.objects
        .filter(Q(company_user=request.user) | Q(candidate=request.user), is_active=True)
        .select_related("application__job", "company_user", "candidate")
        .order_by("-created_at")
    )
    data = [_serialize_room(r, request.user) for r in rooms]
    return JsonResponse({"results": data})


# ─── Messages ──────────────────────────────────────────────

@require_GET
def chat_messages(request, room_id):
    """
    GET /api/chat/rooms/<room_id>/messages/
    List messages in a room. Marks unread messages from the other party as read.
    """
    room, err = _user_room(request, room_id)
    if err:
        return err

    messages = room.messages.order_by("created_at")[:500]
    data = [_serialize_message(m) for m in messages]

    # Mark unread from the other party as read
    ChatMessage.objects.filter(
        room=room, is_read=False
    ).exclude(sender=request.user).update(is_read=True)

    return JsonResponse({"results": data})


@require_http_methods(["POST"])
def chat_send(request, room_id):
    """
    POST /api/chat/rooms/<room_id>/send/
    Send a message. Body: {"text": "..."}
    """
    room, err = _user_room(request, room_id)
    if err:
        return err

    try:
        body = json.loads(request.body)
    except (json.JSONDecodeError, TypeError):
        return JsonResponse({"error": "Некорректный JSON."}, status=400)

    text = (body.get("text") or "").strip()
    if not text:
        return JsonResponse({"error": "Сообщение не может быть пустым."}, status=400)

    msg = ChatMessage.objects.create(room=room, sender=request.user, text=text)

    # Notify the other user
    try:
        from apps.notifications.services import create_notification
        from apps.notifications.models import NotificationType
        other = room.candidate if request.user.pk == room.company_user_id else room.company_user
        sender_name = request.user.get_full_name() or request.user.username
        create_notification(
            other,
            NotificationType.GENERAL,
            "Новое сообщение",
            f"{sender_name}: {text[:100]}",
            link="/my-applications",
        )
    except Exception:
        pass

    return JsonResponse({"success": True, "message": _serialize_message(msg)}, status=201)


# ─── Interviews ────────────────────────────────────────────

@require_http_methods(["POST"])
def interview_create(request, room_id):
    """
    POST /api/chat/rooms/<room_id>/interview/
    Company creates an interview invite.
    Body: {"scheduled_at": "ISO", "duration_minutes": 30, "format": "online", "location": "...", "note": "..."}
    """
    room, err = _user_room(request, room_id)
    if err:
        return err

    # Only the company side can create interviews
    if request.user.pk != room.company_user_id:
        return JsonResponse({"error": "Только компания может отправлять приглашения."}, status=403)

    try:
        body = json.loads(request.body)
    except (json.JSONDecodeError, TypeError):
        return JsonResponse({"error": "Некорректный JSON."}, status=400)

    scheduled_at = body.get("scheduled_at")
    if not scheduled_at:
        return JsonResponse({"error": "Дата и время обязательны."}, status=400)

    try:
        from django.utils.dateparse import parse_datetime
        dt = parse_datetime(scheduled_at)
        if not dt:
            raise ValueError
    except (ValueError, TypeError):
        return JsonResponse({"error": "Некорректный формат даты."}, status=400)

    fmt = body.get("format", "online")
    if fmt not in [c[0] for c in InterviewFormat.choices]:
        fmt = "online"

    invite = InterviewInvite.objects.create(
        room=room,
        scheduled_at=dt,
        duration_minutes=int(body.get("duration_minutes", 30)),
        format=fmt,
        location=(body.get("location") or "").strip(),
        note=(body.get("note") or "").strip(),
    )

    # Auto-send a chat message about the interview
    ChatMessage.objects.create(
        room=room,
        sender=request.user,
        text=f"📅 Приглашение на интервью: {dt.strftime('%d.%m.%Y %H:%M')} ({InterviewFormat(fmt).label})"
        + (f"\n📍 {invite.location}" if invite.location else "")
        + (f"\n💬 {invite.note}" if invite.note else ""),
    )

    # Notify candidate
    try:
        from apps.notifications.services import create_notification
        from apps.notifications.models import NotificationType
        create_notification(
            room.candidate,
            NotificationType.JOB,
            "Приглашение на интервью",
            f"Вас пригласили на интервью ({InterviewFormat(fmt).label}) — {dt.strftime('%d.%m.%Y %H:%M')}",
            link="/my-applications",
        )
    except Exception:
        pass

    return JsonResponse({"success": True, "interview": _serialize_interview(invite)}, status=201)


@require_http_methods(["POST"])
def interview_respond(request, invite_id):
    """
    POST /api/chat/interviews/<invite_id>/respond/
    Candidate responds: {"action": "accept" | "decline" | "reschedule", "comment": "..."}
    """
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Требуется авторизация."}, status=401)

    invite = get_object_or_404(InterviewInvite.objects.select_related("room"), pk=invite_id)

    if request.user.pk != invite.room.candidate_id:
        return JsonResponse({"error": "Только кандидат может ответить на приглашение."}, status=403)

    if invite.status not in (InterviewStatus.PENDING, InterviewStatus.RESCHEDULED):
        return JsonResponse({"error": "На это приглашение уже дан ответ."}, status=400)

    try:
        body = json.loads(request.body)
    except (json.JSONDecodeError, TypeError):
        return JsonResponse({"error": "Некорректный JSON."}, status=400)

    action = (body.get("action") or "").strip()
    comment = (body.get("comment") or "").strip()

    if action == "accept":
        invite.status = InterviewStatus.ACCEPTED
        msg_text = "✅ Приглашение на интервью подтверждено"
    elif action == "decline":
        invite.status = InterviewStatus.DECLINED
        msg_text = "❌ Приглашение на интервью отклонено"
    elif action == "reschedule":
        invite.status = InterviewStatus.RESCHEDULED
        msg_text = "🔄 Кандидат предлагает перенести интервью"
    else:
        return JsonResponse({"error": "Допустимые действия: accept, decline, reschedule."}, status=400)

    invite.candidate_comment = comment
    invite.save(update_fields=["status", "candidate_comment"])

    if comment:
        msg_text += f"\n💬 {comment}"

    ChatMessage.objects.create(room=invite.room, sender=request.user, text=msg_text)

    # Notify company
    try:
        from apps.notifications.services import create_notification
        from apps.notifications.models import NotificationType
        candidate_name = request.user.get_full_name() or request.user.username
        create_notification(
            invite.room.company_user,
            NotificationType.JOB,
            "Ответ на приглашение",
            f"{candidate_name} — {msg_text.split(chr(10))[0]}",
            link="/company",
        )
    except Exception:
        pass

    return JsonResponse({"success": True, "interview": _serialize_interview(invite)})


@require_GET
def room_interviews(request, room_id):
    """
    GET /api/chat/rooms/<room_id>/interviews/
    List all interviews for this chat room.
    """
    room, err = _user_room(request, room_id)
    if err:
        return err

    invites = room.interviews.order_by("-scheduled_at")
    return JsonResponse({"results": [_serialize_interview(i) for i in invites]})
