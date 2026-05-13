"""
API: список, детали, запись и отметка посещаемости мероприятий.
"""


from django.conf import settings
from django.contrib.auth import authenticate, get_user_model
from django.http import HttpResponse, JsonResponse
from django.middleware.csrf import get_token
from django.shortcuts import get_object_or_404
from django.urls import reverse
from django.utils import timezone
from django.utils.html import escape
from django.views.decorators.http import require_GET, require_http_methods
from django_ratelimit.decorators import ratelimit

from apps.common.audit import record_audit_event
from apps.common.utils import paginate_queryset
from .models import Event, EventRegistration
from .models import RegistrationStatus
from .services import cancel_event_registration, check_in_registration, register_user_for_event
from .utils import sync_event_counters

User = get_user_model()


def _build_checkin_url(request, token: str) -> str:
    path = reverse("event-checkin", args=[token])
    public_base = getattr(settings, "CHECKIN_PUBLIC_BASE_URL", "").strip()
    if public_base:
        return public_base.rstrip("/") + path
    return request.build_absolute_uri(path)


@require_GET
def event_detail(request, pk):
    """
    GET /api/events/<id>/
    """
    event = get_object_or_404(Event, pk=pk)

    if not event.is_published:
        return JsonResponse(
            {"error": "Мероприятие не опубликовано."},
            status=403,
        )

    sync_event_counters(event)

    data = {
        "id": event.pk,
        "title": event.title,
        "slug": event.slug,
        "event_type": event.event_type,
        "description": event.description or "",
        "date": event.date.isoformat(),
        "time": event.time.strftime("%H:%M"),
        "duration_minutes": event.duration_minutes,
        "location": event.location or "",
        "is_online": event.is_online,
        "meeting_link": event.meeting_link or "",
        "capacity": event.capacity,
        "registered_count": event.registered_count,
        "waitlist_count": event.waitlist_count,
        "banner_image": event.banner_image.url if event.banner_image else None,
        "organizer": event.organizer.username if event.organizer_id else "",
    }

    return JsonResponse(data)


@require_GET
def event_list(request):
    """
    GET /api/events/
    """

    events = Event.objects.filter(is_published=True).order_by("date", "time")
    page_items, meta = paginate_queryset(request, events, per_page=50)

    data = [
        {
            "id": e.pk,
            "title": e.title,
            "slug": e.slug,
            "event_type": e.event_type,
            "date": e.date.isoformat(),
            "time": e.time.strftime("%H:%M"),
            "location": e.location or "",
            "is_online": e.is_online,
            "registered_count": e.registered_count,
            "capacity": e.capacity,
            "description": (e.description or "")[:200],
            "banner_image": e.banner_image.url if e.banner_image else None,
        }
        for e in page_items
    ]

    return JsonResponse({"results": data, "pagination": meta})


@ratelimit(key="ip", rate="600/h", method="GET")
@ratelimit(key="ip", rate="200/m", method="POST")
@require_http_methods(["GET", "POST"])
def event_checkin(request, token: str):
    """
    GET /checkin/<token>/

    Presence checker сканирует QR-код участника.
    """

    registration = get_object_or_404(
        EventRegistration.objects.select_related("user", "event"),
        qr_token=token,
    )

    def _render_checker_login(error_html: str = "") -> HttpResponse:
        csrf_token = get_token(request)
        return HttpResponse(
            f"""
            <html>
            <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Checker Login</title></head>
            <body style="font-family:system-ui;background:#fdf2f8;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0">
              <form method="post" style="background:#fff;padding:20px;border:1px solid #fbcfe8;border-radius:12px;min-width:300px">
                <h3 style="margin-top:0">Вход checker</h3>
                <p style="color:#666;margin-top:0">Скан QR -> войдите как checker -> отметка посещения.</p>
                {error_html}
                <input type="hidden" name="csrfmiddlewaretoken" value="{escape(csrf_token)}" />
                <input name="username" placeholder="username" style="width:100%;padding:10px;margin-bottom:8px;border:1px solid #ddd;border-radius:8px" />
                <input name="password" type="password" placeholder="password" style="width:100%;padding:10px;margin-bottom:10px;border:1px solid #ddd;border-radius:8px" />
                <button type="submit" style="width:100%;padding:10px;border:none;border-radius:8px;background:#ec4899;color:#fff">Войти и отметить</button>
              </form>
            </body>
            </html>
            """,
            status=401,
        )

    def _checker_has_rights(u) -> bool:
        return bool(
            getattr(u, "is_presence_checker", False)
            or u.is_superuser
            or u.is_staff
        )

    def _get_recent_checker_from_session():
        verified_at = request.session.get("checker_verified_at")
        checker_user_id = request.session.get("checker_user_id")
        if not verified_at or not checker_user_id:
            return None
        now_ts = int(timezone.now().timestamp())
        if now_ts - int(verified_at) > 30 * 60:
            request.session.pop("checker_verified_at", None)
            request.session.pop("checker_user_id", None)
            return None
        checker_user = User.objects.filter(pk=checker_user_id).first()
        if not checker_user or not _checker_has_rights(checker_user):
            request.session.pop("checker_verified_at", None)
            request.session.pop("checker_user_id", None)
            return None
        return checker_user

    checker_user = None

    if request.method == "GET":
        checker_user = _get_recent_checker_from_session()
        if checker_user is None:
            return _render_checker_login()
    else:
        username = (request.POST.get("username") or "").strip()
        password = request.POST.get("password") or ""
        checker_user = authenticate(request, username=username, password=password)
        if checker_user is None:
            return _render_checker_login(
                "<p style='color:#b91c1c'>Неверный логин или пароль.</p>"
            )

        if not _checker_has_rights(checker_user):
            return _render_checker_login(
                "<p style='color:#b91c1c'>Нет прав checker для отметки посещения.</p>"
            )

        request.session["checker_verified_at"] = int(timezone.now().timestamp())
        request.session["checker_user_id"] = checker_user.pk

    event = registration.event

    # защита от self scan
    if checker_user.pk == registration.user_id:
        return HttpResponse(
            """
            <html>
            <body>
            <h2>Это ваш QR-код</h2>
            <p>Посещение отмечает только presence checker.</p>
            </body>
            </html>
            """
        )

    now = timezone.now()

    # Time window restriction removed:
    # check-in is protected by checker authentication and permissions.

    if registration.checked_in:
        time_str = registration.checked_in_at.strftime("%d.%m.%Y %H:%M")
        return HttpResponse(
            f"""
            <html>
            <body>
            <h2>Participant already checked in</h2>
            <p>Checked in at: {time_str}</p>
            </body>
            </html>
            """
        )

    registration, _changed = check_in_registration(registration_id=registration.pk, checker_user=checker_user)
    user = registration.user
    record_audit_event(
        request,
        "event.checkin",
        target_type="event_registration",
        target_id=registration.pk,
        metadata={"event_id": event.pk, "participant_id": user.pk, "checker_id": checker_user.pk},
    )

    participant_name = escape(
        user.get_full_name() or user.username or user.email or "Участник"
    )

    event_title = escape(event.title)

    photo_url = (
        request.build_absolute_uri(user.profile_photo.url)
        if getattr(user, "profile_photo", None)
        else None
    )

    initials = (user.first_name[:1] if user.first_name else "") + (
        user.last_name[:1] if user.last_name else ""
    )

    if not initials and user.username:
        initials = user.username[:2].upper()

    if not initials and user.email:
        initials = user.email[:2].upper()

    initials = escape((initials or "?").upper())

    visit_time = now.strftime("%d.%m.%Y %H:%M")

    html = f"""
    <html>
    <head>
    <meta charset="utf-8">
    <title>Check-in</title>
    <style>

    body {{
        font-family:system-ui;
        background:#fdf2f8;
        display:flex;
        align-items:center;
        justify-content:center;
        min-height:100vh;
    }}

    .card {{
        background:white;
        padding:40px;
        border-radius:20px;
        text-align:center;
        box-shadow:0 20px 40px rgba(0,0,0,0.1);
        max-width:400px;
        width:100%;
    }}

    .photo {{
        width:120px;
        height:120px;
        border-radius:50%;
        overflow:hidden;
        margin:auto;
        margin-bottom:20px;
        background:#eee;
        display:flex;
        align-items:center;
        justify-content:center;
        font-size:40px;
        font-weight:bold;
    }}

    img {{
        width:100%;
        height:100%;
        object-fit:cover;
    }}

    </style>
    </head>

    <body>

    <div class="card">

    <div class="photo">
    {"<img src='"+escape(photo_url)+"'>" if photo_url else initials}
    </div>

    <h2>{participant_name}</h2>

    <p><b>Мероприятие</b><br>{event_title}</p>

    <p><b>Время отметки</b><br>{visit_time}</p>

    <p style="margin-top:20px;color:green;"><b>Посещение засчитано</b></p>

    {"<p style='margin-top:12px;padding:10px 16px;background:#ecfdf5;border:1px solid #6ee7b7;border-radius:12px;color:#065f46;font-weight:600'>&#9989; Участник верифицирован</p>" if user.is_verified else ""}

    </div>

    </body>
    </html>
    """

    return HttpResponse(html)


@require_GET
def my_registrations(request):
    """
    GET /api/events/my-registrations/
    """

    if not request.user.is_authenticated:
        return JsonResponse({"results": []})

    regs = (
        EventRegistration.objects.filter(
            user=request.user,
            status=RegistrationStatus.REGISTERED,
        )
        .select_related("event")
        .order_by("event__date", "event__time")
    )

    data = []

    for r in regs:
        e = r.event

        checkin_url = _build_checkin_url(request, r.qr_token)

        data.append({
            "id": e.pk,
            "title": e.title,
            "event_type": e.event_type,
            "date": e.date.isoformat(),
            "time": e.time.strftime("%H:%M"),
            "duration_minutes": e.duration_minutes,
            "location": e.location or "",
            "is_online": e.is_online,
            "is_waitlist": r.is_waitlist,
            "organizer_confirmed": r.organizer_confirmed,
            "visits_count": r.visits_count,
            "checkin_url": checkin_url,
            "registered_count": e.registered_count,
            "capacity": e.capacity,
        })

    return JsonResponse({"results": data})


@require_http_methods(["GET", "POST", "DELETE"])
def event_register(request, pk):
    """
    /api/events/<id>/register/
    """

    event = get_object_or_404(Event, pk=pk)
    sync_event_counters(event)

    if not event.is_published:
        return JsonResponse({"error": "Мероприятие не опубликовано."}, status=403)

    if request.method == "GET":

        if not request.user.is_authenticated:
            return JsonResponse({"registered": False})

        reg = EventRegistration.objects.filter(
            event=event,
            user=request.user,
            status=RegistrationStatus.REGISTERED
        ).first()

        if not reg:
            return JsonResponse({"registered": False})

        return JsonResponse({
            "registered": True,
            "is_waitlist": reg.is_waitlist,
            "organizer_confirmed": reg.organizer_confirmed,
        })

    if not request.user.is_authenticated:
        return JsonResponse({"error": "Требуется авторизация"}, status=401)

    if getattr(request.user, "is_company_user", False):
        return JsonResponse(
            {"error": "Аккаунт компании не может записываться на мероприятия."},
            status=403,
        )

    reg = EventRegistration.objects.filter(
        event=event,
        user=request.user
    ).first()

    if request.method == "POST":

        if reg and reg.status == RegistrationStatus.REGISTERED:
            return JsonResponse(
                {"error": "Вы уже записаны."},
                status=409,
            )

        result = register_user_for_event(event_id=event.pk, user=request.user)
        reg = result.registration
        is_waitlist = result.is_waitlist
        record_audit_event(
            request,
            "event.register",
            target_type="event",
            target_id=event.pk,
            metadata={"registration_id": reg.pk, "is_waitlist": is_waitlist},
        )
        if result.created:
            try:
                from services.google_sheets import add_registration_row
                add_registration_row(event, request.user)
            except Exception as e:
                import logging
                logging.getLogger(__name__).exception("Google Sheets sync failed: %s", e)

        try:
            from apps.notifications.services import create_notification
            from apps.notifications.models import NotificationType
            create_notification(
                request.user,
                NotificationType.EVENT,
                "Вы записаны на мероприятие",
                f"Вы участвуете в мероприятии «{event.title}»." + (" Вы в листе ожидания." if is_waitlist else ""),
                link=f"/events/{event.pk}",
            )
        except Exception:
            pass

        return JsonResponse(
            {"success": True, "is_waitlist": is_waitlist},
            status=201,
        )

    if request.method == "DELETE":

        if not reg or reg.status != RegistrationStatus.REGISTERED:
            return JsonResponse(
                {"error": "Вы не записаны."},
                status=400,
            )

        if not cancel_event_registration(event_id=event.pk, user=request.user):
            return JsonResponse({"error": "Registration not found."}, status=400)
        record_audit_event(request, "event.cancel_registration", target_type="event", target_id=event.pk)

        return JsonResponse({"success": True})
