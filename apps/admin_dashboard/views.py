"""
Staff-only API for admin dashboard: users list, companies list, events with registrations.
"""
import json

from django.contrib.auth import get_user_model
from django.db.models import Count, Q
from django.http import JsonResponse, HttpResponse
from django.views.decorators.http import require_GET, require_http_methods

from django.utils import timezone

from apps.companies.models import Company
from apps.common.audit import record_audit_event
from apps.events.models import Event, EventRegistration
from apps.events.models import RegistrationStatus
from apps.events.utils import sync_event_counters

User = get_user_model()


def _require_staff(request):
    """Return 401/403 response if not authenticated or not staff; else None."""
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Требуется авторизация."}, status=401)
    if not request.user.is_staff:
        return JsonResponse({"error": "Доступ только для администраторов."}, status=403)
    return None


def _require_staff_or_presence_checker(request):
    """Allow staff, superuser, or dedicated presence checker users."""
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Требуется авторизация."}, status=401)
    if request.user.is_staff or request.user.is_superuser or getattr(request.user, "is_presence_checker", False):
        return None
    return JsonResponse({"error": "Доступ только для staff/presence checker."}, status=403)


@require_GET
def admin_users(request):
    """
    GET /api/admin/users/
    List all users (staff only). Optional query: search=
    """
    err = _require_staff(request)
    if err:
        return err
    from django.db.models import Q
    search = (request.GET.get("search") or "").strip()
    if search:
        qs = (
            User.objects.filter(
                Q(username__icontains=search)
                | Q(email__icontains=search)
                | Q(first_name__icontains=search)
                | Q(last_name__icontains=search)
            )
            .annotate(
                total_checkins=Count(
                    "event_registrations",
                    filter=Q(event_registrations__checked_in=True),
                )
            )
            .order_by("-date_joined")
        )
    else:
        qs = (
            User.objects.all()
            .annotate(
                total_checkins=Count(
                    "event_registrations",
                    filter=Q(event_registrations__checked_in=True),
                )
            )
            .order_by("-date_joined")
        )
    users = []
    for u in qs[:500]:
        users.append({
            "id": u.pk,
            "username": u.username,
            "email": u.email or "",
            "first_name": u.first_name or "",
            "last_name": u.last_name or "",
            "display_name": u.display_name,
            "phone": u.phone or "",
            "is_staff": u.is_staff,
            "is_active": u.is_active,
            "is_verified": u.is_verified,
            "total_checkins": int(getattr(u, "total_checkins", 0) or 0),
            "has_cv": bool(u.cv_file),
            "date_joined": u.date_joined.isoformat() if u.date_joined else None,
        })
    return JsonResponse({"results": users})


@require_GET
def admin_companies(request):
    """
    GET /api/admin/companies/
    List all companies (staff only). Optional query: search=
    """
    err = _require_staff(request)
    if err:
        return err
    from django.db.models import Q
    search = (request.GET.get("search") or "").strip()
    if search:
        qs = Company.objects.filter(
            Q(company_name__icontains=search) | Q(location__icontains=search)
        ).order_by("company_name")
    else:
        qs = Company.objects.all().order_by("company_name")
    companies = []
    for c in qs[:500]:
        companies.append({
            "id": c.pk,
            "company_name": c.company_name,
            "slug": c.slug,
            "industry": c.industry,
            "size": c.size,
            "location": c.location,
            "is_verified": c.is_verified,
            "is_approved_for_talents": c.is_approved_for_talents,
            "website": c.website or "",
        })
    return JsonResponse({"results": companies})


@require_GET
def admin_events_registrations(request):
    """
    GET /api/admin/event-registrations/
    List events; each event includes a list of registered participants (staff only).
    Option B: events with nested registrations.
    """
    err = _require_staff(request)
    if err:
        return err
    events = (
        Event.objects.all()
        .prefetch_related("registrations__user")
        .order_by("-date", "-time")
    )
    out = []
    for e in events:
        regs = []
        for r in e.registrations.filter(status=RegistrationStatus.REGISTERED).select_related("user"):
            u = r.user
            regs.append({
                "id": r.pk,
                "user_id": u.pk,
                "username": u.username,
                "email": u.email or "",
                "full_name": u.get_full_name() or u.display_name or u.username,
                "is_waitlist": r.is_waitlist,
                "registered_at": r.registered_at.isoformat() if r.registered_at else None,
                "visits_count": getattr(r, "visits_count", 0),
            })
        out.append({
            "id": e.pk,
            "title": e.title,
            "date": e.date.isoformat() if e.date else None,
            "time": str(e.time) if e.time else None,
            "location": e.location or "",
            "capacity": e.capacity,
            "registered_count": e.registered_count,
            "waitlist_count": e.waitlist_count,
            "registrations": regs,
        })
    return JsonResponse({"results": out})


@require_GET
def admin_users_analytics(request):
    """
    GET /api/admin/users-analytics/
    Агрегированная аналитика по пользователям (staff only).
    """
    err = _require_staff(request)
    if err:
        return err

    from django.db.models import Avg, Count, Min, Max
    from django.db.models.functions import TruncMonth

    qs = User.objects.all()

    total_users = qs.count()
    active_users = qs.filter(is_active=True).count()
    staff_users = qs.filter(is_staff=True).count()
    verified_email_users = qs.filter(is_verified_email=True).count()

    age_agg = qs.aggregate(
        age_count=Count("age"),
        age_avg=Avg("age"),
        age_min=Min("age"),
        age_max=Max("age"),
    )

    education_labels = {
        getattr(User, "EDUCATION_STUDENT", "student"): "Студент",
        getattr(User, "EDUCATION_GRADUATE", "graduate"): "Выпускница",
        getattr(User, "EDUCATION_NOT_STUDYING", "not_studying"): "Не учусь",
    }

    education_breakdown_raw = (
        qs.values("education_status")
        .annotate(count=Count("id"))
        .order_by("-count")
    )
    education_breakdown = []
    for row in education_breakdown_raw:
        status = row.get("education_status")
        count = row.get("count") or 0
        education_breakdown.append(
            {
                "status": status,
                "label": education_labels.get(status, "Неизвестно" if status is None else str(status)),
                "count": count,
            }
        )

    city_top_qs = (
        qs.exclude(city__isnull=True)
        .exclude(city__exact="")
        .values("city")
        .annotate(count=Count("id"))
        .order_by("-count")[:10]
    )
    city_top_sum = sum((r.get("count") or 0) for r in city_top_qs)
    unknown_city_count = max(total_users - city_top_sum, 0)
    city_top = [
        {"city": r.get("city"), "count": r.get("count") or 0}
        for r in city_top_qs
    ]
    if unknown_city_count > 0:
        city_top.append({"city": "Не указали", "count": unknown_city_count})

    # Простые возрастные бакеты
    age_buckets = [
        {"bucket": "10-17", "count": qs.filter(age__gte=10, age__lte=17).count()},
        {"bucket": "18-24", "count": qs.filter(age__gte=18, age__lte=24).count()},
        {"bucket": "25-35", "count": qs.filter(age__gte=25, age__lte=35).count()},
        {"bucket": "36-45", "count": qs.filter(age__gte=36, age__lte=45).count()},
        {"bucket": "46+", "count": qs.filter(age__gte=46).count()},
    ]

    # Регистрации по месяцам (последние 6 месяцев)
    month_breakdown = (
        qs.annotate(month=TruncMonth("date_joined"))
        .values("month")
        .annotate(count=Count("id"))
        .order_by("-month")[:6]
    )
    registrations_last_6_months = [
        {"month": (r["month"].isoformat() if r.get("month") else None), "count": r.get("count") or 0}
        for r in month_breakdown[::-1]
    ]

    return JsonResponse(
        {
            "summary": {
                "total_users": total_users,
                "active_users": active_users,
                "staff_users": staff_users,
                "verified_email_users": verified_email_users,
                "age": {
                    "count": age_agg.get("age_count") or 0,
                    "avg": age_agg.get("age_avg"),
                    "min": age_agg.get("age_min"),
                    "max": age_agg.get("age_max"),
                },
            },
            "education_status_breakdown": education_breakdown,
            "city_top": city_top,
            "age_buckets": age_buckets,
            "registrations_last_6_months": registrations_last_6_months,
        }
    )


@require_GET
def admin_checkins(request):
    """
    GET /api/admin/checkins/
    Плоский список регистраций для быстрой проверки check-in и подтверждения.
    Опционально: ?event_id=<id>
    """
    err = _require_staff_or_presence_checker(request)
    if err:
        return err
    record_audit_event(request, "admin.view_checkins", target_type="event", target_id=request.GET.get("event_id", ""))

    event_id = (request.GET.get("event_id") or "").strip()

    regs_qs = (
        EventRegistration.objects.select_related("user", "event")
        .filter(status=RegistrationStatus.REGISTERED)
        .order_by("-registered_at")
    )
    if event_id.isdigit():
        regs_qs = regs_qs.filter(event_id=int(event_id))

    items = []
    for r in regs_qs[:500]:
        u = r.user
        e = r.event
        items.append(
            {
                "id": r.pk,
                "event_id": e.pk,
                "event_title": e.title,
                "username": u.username,
                "full_name": u.get_full_name() or u.display_name or u.username,
                "email": u.email or "",
                "organizer_confirmed": r.organizer_confirmed,
                "checked_in": r.checked_in,
                "visits_count": r.visits_count,
                "registered_at": r.registered_at.isoformat() if r.registered_at else None,
                "checked_in_at": r.checked_in_at.isoformat() if r.checked_in_at else None,
            }
        )

    events = [
        {"id": e.pk, "title": e.title}
        for e in Event.objects.all().order_by("date", "time")[:200]
    ]

    return JsonResponse({"results": items, "events": events})


@require_GET
def admin_users_without_event_registrations(request):
    """
    GET /api/admin/users-without-event-registrations/
    Users without active (REGISTERED) event registrations.
    Accessible for staff and presence checker.
    """
    err = _require_staff_or_presence_checker(request)
    if err:
        return err
    record_audit_event(request, "admin.view_presence_users_without_registrations")

    registered_user_ids = EventRegistration.objects.filter(
        status=RegistrationStatus.REGISTERED
    ).values_list("user_id", flat=True)

    users_qs = (
        User.objects.filter(is_active=True)
        .exclude(is_staff=True)
        .exclude(is_superuser=True)
        .exclude(is_presence_checker=True)
        .exclude(id__in=registered_user_ids)
        .order_by("username")
    )

    items = []
    for u in users_qs[:1000]:
        items.append(
            {
                "id": u.pk,
                "username": u.username,
                "full_name": u.get_full_name() or u.display_name or u.username,
                "email": u.email or "",
                "registered_for_any_event": False,
            }
        )

    return JsonResponse({"results": items})


@require_GET
def admin_all_users_for_presence_checker(request):
    """
    GET /api/admin/users-for-presence-checker/
    All users (absolutely all) with registration stats.
    Accessible for staff and presence checker.
    Optional: ?search=<query>
    """
    err = _require_staff_or_presence_checker(request)
    if err:
        return err
    record_audit_event(request, "admin.view_presence_users", metadata={"search": bool(request.GET.get("search"))})

    search = (request.GET.get("search") or "").strip()

    qs = (
        User.objects.filter(is_active=True)
        .exclude(is_staff=True)
        .exclude(is_superuser=True)
        .exclude(is_presence_checker=True)
        .annotate(
            registered_events_count=Count(
                "event_registrations",
                filter=Q(event_registrations__status=RegistrationStatus.REGISTERED),
            ),
            total_checkins=Count(
                "event_registrations",
                filter=Q(event_registrations__checked_in=True),
            ),
        )
        .order_by("first_name", "last_name", "username")
    )

    if search:
        qs = qs.filter(
            Q(username__icontains=search)
            | Q(email__icontains=search)
            | Q(first_name__icontains=search)
            | Q(last_name__icontains=search)
            | Q(phone__icontains=search)
        )

    items = []
    for u in qs[:2000]:
        reg_count = int(getattr(u, "registered_events_count", 0) or 0)
        items.append(
            {
                "id": u.pk,
                "username": u.username,
                "full_name": u.get_full_name() or u.display_name or u.username,
                "email": u.email or "",
                "phone": u.phone or "",
                "city": u.city or "",
                "bio": u.bio or "",
                "education_status": u.education_status or "",
                "university": u.university or "",
                "is_verified": u.is_verified,
                "is_company_user": getattr(u, "is_company_user", False),
                "is_staff": u.is_staff,
                "registered_events_count": reg_count,
                "registered_for_any_event": reg_count > 0,
                "total_checkins": int(getattr(u, "total_checkins", 0) or 0),
                "date_joined": u.date_joined.isoformat() if u.date_joined else None,
            }
        )
    return JsonResponse({"results": items, "total": len(items)})


@require_http_methods(["POST"])
def admin_checkin_confirm(request, registration_id: int):
    """
    POST /api/admin/checkins/<registration_id>/confirm/
    Ручное подтверждение organizer_confirmed для регистрации.
    """
    err = _require_staff_or_presence_checker(request)
    if err:
        return err

    reg = EventRegistration.objects.filter(pk=registration_id).first()
    if not reg:
        return JsonResponse({"error": "Регистрация не найдена."}, status=404)

    if reg.status != RegistrationStatus.REGISTERED:
        return JsonResponse({"error": "Можно подтверждать только активные регистрации."}, status=400)

    # If user is in waitlist and there is free capacity, promote to main registered list.
    event = reg.event
    sync_event_counters(event)
    if reg.is_waitlist and event.registered_count < event.capacity:
        reg.is_waitlist = False
        if not reg.organizer_confirmed:
            reg.organizer_confirmed = True
            reg.save(update_fields=["is_waitlist", "organizer_confirmed"])
        else:
            reg.save(update_fields=["is_waitlist"])
        sync_event_counters(event)
        return JsonResponse(
            {
                "success": True,
                "id": reg.pk,
                "organizer_confirmed": reg.organizer_confirmed,
                "is_waitlist": reg.is_waitlist,
                "promoted": True,
            }
        )

    if not reg.organizer_confirmed:
        reg.organizer_confirmed = True
        reg.save(update_fields=["organizer_confirmed"])

    return JsonResponse(
        {
            "success": True,
            "id": reg.pk,
            "organizer_confirmed": reg.organizer_confirmed,
            "is_waitlist": reg.is_waitlist,
            "promoted": False,
        }
    )


@require_GET
def admin_user_detail(request, user_id: int):
    """
    GET /api/admin/users/<user_id>/
    Full user detail including CV url (staff only).
    """
    err = _require_staff(request)
    if err:
        return err

    u = User.objects.filter(pk=user_id).first()
    if not u:
        return JsonResponse({"error": "Пользователь не найден."}, status=404)
    record_audit_event(request, "admin.view_user_detail", target_type="user", target_id=u.pk)

    total_checkins = EventRegistration.objects.filter(user=u, checked_in=True).count()

    attended_events = []
    for reg in EventRegistration.objects.filter(user=u, checked_in=True).select_related("event").order_by("-checked_in_at"):
        attended_events.append({
            "event_id": reg.event_id,
            "event_title": reg.event.title,
            "checked_in_at": reg.checked_in_at.isoformat() if reg.checked_in_at else None,
        })

    data = {
        "id": u.pk,
        "username": u.username,
        "email": u.email or "",
        "first_name": u.first_name or "",
        "last_name": u.last_name or "",
        "display_name": u.display_name,
        "phone": u.phone or "",
        "bio": u.bio or "",
        "age": u.age,
        "city": u.city or "",
        "education_status": u.education_status or "",
        "university": u.university or "",
        "is_staff": u.is_staff,
        "is_active": u.is_active,
        "is_verified": u.is_verified,
        "verified_at": u.verified_at.isoformat() if u.verified_at else None,
        "total_checkins": total_checkins,
        "cv_file": request.build_absolute_uri(u.cv_file.url) if u.cv_file else None,
        "profile_photo": request.build_absolute_uri(u.profile_photo.url) if u.profile_photo else None,
        "date_joined": u.date_joined.isoformat() if u.date_joined else None,
        "attended_events": attended_events,
    }
    return JsonResponse(data)


@require_http_methods(["POST"])
def admin_company_approve_talents(request, company_id: int):
    """
    POST /api/admin/companies/<company_id>/approve-talents/
    Admin approves (or toggles) a company's access to verified participants.
    """
    err = _require_staff(request)
    if err:
        return err

    company = Company.objects.filter(pk=company_id).first()
    if not company:
        return JsonResponse({"error": "Компания не найдена."}, status=404)
    try:
        body = json.loads(request.body)
    except (json.JSONDecodeError, TypeError):
        body = {}

    approve = body.get("approve", True)
    record_audit_event(
        request,
        "admin.update_company_talent_access",
        target_type="company",
        target_id=company.pk,
        metadata={"approve": approve},
    )

    if approve:
        company.is_approved_for_talents = True
        company.approved_for_talents_at = timezone.now()
        if not company.is_verified:
            company.is_verified = True
            company.verified_by = request.user
            company.verified_at = timezone.now()
        company.save(update_fields=[
            "is_approved_for_talents", "approved_for_talents_at",
            "is_verified", "verified_by", "verified_at",
        ])
    else:
        company.is_approved_for_talents = False
        company.approved_for_talents_at = None
        company.save(update_fields=["is_approved_for_talents", "approved_for_talents_at"])

    return JsonResponse({
        "success": True,
        "company_id": company.pk,
        "is_approved_for_talents": company.is_approved_for_talents,
        "is_verified": company.is_verified,
    })


@require_GET
def checkins_simple_page(request):
    """
    GET /checkins-simple/
    Minimal standalone UI (no React) for:
    - login
    - see registered users
    - confirm registration
    - view visits_count
    """
    html = """
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Checkins Simple</title>
  <style>
    body{font-family:system-ui;margin:0;background:#f7f7f9;color:#111}
    .wrap{max-width:1100px;margin:0 auto;padding:20px}
    .card{background:#fff;border:1px solid #ddd;border-radius:10px;padding:14px;margin-bottom:12px}
    input,select,button{padding:10px;border-radius:8px;border:1px solid #ccc}
    button{cursor:pointer;background:#ec4899;color:#fff;border:none}
    table{width:100%;border-collapse:collapse;background:#fff}
    th,td{border-bottom:1px solid #eee;padding:8px;text-align:left;font-size:14px}
    .muted{color:#666}
    .err{background:#fee;border:1px solid #f99;padding:8px;border-radius:8px}
    .ok{background:#efe;border:1px solid #9d9;padding:8px;border-radius:8px}
  </style>
</head>
<body>
  <div class="wrap">
    <h2>Checkins Simple</h2>
    <p class="muted">Only: login, list users, confirm registration, see visits count.</p>

    <div class="card">
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <input id="u" placeholder="username" />
        <input id="p" placeholder="password" type="password" />
        <input id="eventId" placeholder="event id (optional)" />
        <button id="loginLoad">Login + Load</button>
        <button id="reload">Reload</button>
      </div>
      <div id="status" class="muted" style="margin-top:8px">Not loaded</div>
      <div id="rights" class="muted" style="margin-top:6px">Scanner rights: unknown</div>
      <div id="msg" style="margin-top:8px"></div>
    </div>

    <div class="card">
      <h3 style="margin:0 0 10px 0">QR Scanner (same page)</h3>
      <div class="muted" style="margin-bottom:8px">Start camera and scan participant QR. Visit count should increase after successful scan.</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px">
        <button id="startScan">Start camera</button>
        <button id="stopScan" style="background:#6b7280">Stop camera</button>
      </div>
      <video id="cam" playsinline muted style="width:100%;max-width:520px;border:1px solid #ddd;border-radius:10px;background:#000;display:none"></video>
      <div id="scanBox" style="width:100%;max-width:520px;display:none"></div>
      <div id="scanStatus" class="muted" style="margin-top:8px">Scanner idle</div>
    </div>

    <div class="card">
      <table>
        <thead>
          <tr>
            <th>Event</th>
            <th>User</th>
            <th>Confirmed</th>
            <th>Visits</th>
            <th>Last check-in</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody id="rows"></tbody>
      </table>
    </div>
  </div>

  <script>
    const $ = (id) => document.getElementById(id);
    function getCsrf() {
      const m = document.cookie.match(/(?:^|;\\s*)csrftoken=([^;]*)/);
      return m ? decodeURIComponent(m[1]) : '';
    }
    async function ensureCsrf() {
      if (getCsrf()) return;
      await fetch('/api/auth/csrf/', { credentials: 'include' });
    }
    let currentUser = null;
    let camStream = null;
    let detector = null;
    let html5Qr = null;
    let scanning = false;
    const msg = (text, ok=false) => {
      if(!text){ $("msg").innerHTML = ""; return; }
      $("msg").innerHTML = '<div class="'+(ok?'ok':'err')+'">'+text+'</div>';
    };

    function normalizeCheckinUrl(rawValue) {
      const raw = (rawValue || "").trim();
      if (!raw) return "";
      // Most reliable path: extract token and rebuild URL for current host.
      const tokenMatch = raw.match(/\\/checkin\\/([A-Za-z0-9\\-]+)\\/?/);
      if (tokenMatch && tokenMatch[1]) {
        return window.location.protocol + "//" + window.location.hostname + ":8000/checkin/" + tokenMatch[1] + "/";
      }
      try {
        const u = new URL(raw, window.location.origin);
        if (u.hostname === "127.0.0.1" || u.hostname === "localhost") {
          u.hostname = window.location.hostname;
          u.port = "8000";
          u.protocol = window.location.protocol;
        }
        if (u.pathname.startsWith("/checkin/")) return u.toString();
        return raw;
      } catch (e) {
        if (raw.startsWith("/checkin/")) {
          return window.location.protocol + "//" + window.location.hostname + ":8000" + raw;
        }
        return raw;
      }
    }

    async function login() {
      await ensureCsrf();
      const res = await fetch('/api/auth/login/', {
        method:'POST',
        credentials:'include',
        headers:{'Content-Type':'application/json', 'X-CSRFToken': getCsrf()},
        body: JSON.stringify({ username:$("u").value, password:$("p").value })
      });
      const data = await res.json().catch(() => ({}));
      if(!res.ok){ throw new Error(data.message || 'Login failed'); }
      currentUser = data.user || null;
      if (currentUser) {
        $("rights").textContent = "Scanner rights: " + (currentUser.is_presence_checker ? "granted" : "not granted");
      }
      return currentUser;
    }

    async function loadRows() {
      $("status").textContent = "Loading...";
      const eventId = $("eventId").value.trim();
      const q = eventId ? ('?event_id=' + encodeURIComponent(eventId)) : '';
      const res = await fetch('/api/admin/checkins/' + q, { credentials:'include' });
      const data = await res.json().catch(() => ({}));
      if(!res.ok){ throw new Error(data.error || data.message || 'Load failed'); }
      const rows = data.results || [];
      $("status").textContent = 'Loaded rows: ' + rows.length;
      const body = $("rows");
      body.innerHTML = "";
      for (const r of rows) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${r.event_title || ''}</td>
          <td>${(r.full_name || r.username || '')}</td>
          <td>${r.organizer_confirmed ? 'yes' : 'no'}</td>
          <td><b>${r.visits_count || 0}</b></td>
          <td>${r.checked_in_at || '-'}</td>
          <td>${r.organizer_confirmed ? '' : '<button data-id="'+r.id+'">Confirm</button>'}</td>
        `;
        body.appendChild(tr);
      }
      for (const btn of body.querySelectorAll('button[data-id]')) {
        btn.addEventListener('click', async (e) => {
          const id = e.target.getAttribute('data-id');
          try {
            const r = await fetch('/api/admin/checkins/' + id + '/confirm/', { method:'POST', credentials:'include', headers:{'X-CSRFToken': getCsrf()} });
            const d = await r.json().catch(() => ({}));
            if(!r.ok) throw new Error(d.error || d.message || 'Confirm failed');
            msg('Confirmed #' + id, true);
            await loadRows();
          } catch (err) {
            msg(err.message || 'Confirm failed');
          }
        });
      }
    }

    async function loginAndLoad() {
      msg('');
      try {
        $("status").textContent = "Logging in...";
        const user = await login();
        if(!user || (!user.is_staff && !user.is_presence_checker)) {
          throw new Error('No access: use admin or presence_checker');
        }
        msg('Logged in as ' + user.username, true);
        await loadRows();
      } catch (err) {
        $("status").textContent = "Failed";
        msg(err.message || 'Error');
      }
    }

    async function startScanner() {
      msg('');
      if (!currentUser) {
        msg('Please login first.');
        return;
      }
      if (!currentUser.is_presence_checker && !currentUser.is_staff) {
        msg('This account has no scanner rights.');
        return;
      }
      try {
        if ('BarcodeDetector' in window) {
          detector = new BarcodeDetector({ formats: ['qr_code'] });
          camStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
          const v = $("cam");
          const box = $("scanBox");
          box.style.display = 'none';
          v.srcObject = camStream;
          v.style.display = 'block';
          await v.play();
          scanning = true;
          $("scanStatus").textContent = 'Scanner running (BarcodeDetector)...';

          const loop = async () => {
            if (!scanning || !detector) return;
            try {
              const codes = await detector.detect(v);
              if (codes && codes.length) {
                const raw = (codes[0].rawValue || '').trim();
                if (raw) {
                  const target = normalizeCheckinUrl(raw);
                  $("scanStatus").textContent = 'QR detected, opening check-in...';
                  if (!target) {
                    msg('Scanned QR is empty/invalid');
                    return;
                  }
                  window.location.href = target;
                  return;
                }
              }
            } catch (e) {
              // ignore intermittent detector errors
            }
            if (scanning) requestAnimationFrame(loop);
          };
          requestAnimationFrame(loop);
          return;
        }

        msg('QR scanner is not supported in this browser. Use Chrome/Edge with BarcodeDetector support.');
      } catch (e) {
        $("scanStatus").textContent = 'Scanner failed';
        msg((e && e.message) ? e.message : 'Camera error');
      }
    }

    async function stopScanner() {
      scanning = false;
      if (html5Qr) {
        try { await html5Qr.stop(); } catch (e) {}
        try { await html5Qr.clear(); } catch (e) {}
        html5Qr = null;
      }
      if (camStream) {
        for (const t of camStream.getTracks()) t.stop();
      }
      camStream = null;
      const v = $("cam");
      v.pause();
      v.srcObject = null;
      v.style.display = 'none';
      $("scanBox").style.display = 'none';
      $("scanBox").innerHTML = '';
      $("scanStatus").textContent = 'Scanner stopped';
    }

    $("loginLoad").addEventListener('click', loginAndLoad);
    $("reload").addEventListener('click', () => loadRows().catch(e => msg(e.message || 'Error')));
    $("startScan").addEventListener('click', () => startScanner());
    $("stopScan").addEventListener('click', () => stopScanner());
  </script>
</body>
</html>
    """
    return HttpResponse(html)
