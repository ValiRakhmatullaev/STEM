"""
API: отклик на вакансию (резюме + сопроводительное письмо).
"""
from __future__ import annotations

from django.db.models import Count
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.views.decorators.http import require_GET, require_http_methods

from apps.chat.models import ChatMessage, InterviewInvite, InterviewStatus
from apps.companies.models import JobPosting
from .models import JobApplication

_MAX_RESUME_BYTES = 5 * 1024 * 1024


def _job_title_payload(job):
    return {
        "title": job.title_ru or job.title or job.title_uz or job.title_en or "",
        "title_ru": job.title_ru or job.title or "",
        "title_uz": job.title_uz or "",
        "title_en": job.title_en or "",
    }


def _validate_resume_upload(upload) -> str | None:
    if upload.size > _MAX_RESUME_BYTES:
        return "Файл резюме слишком большой (максимум 5 МБ)."
    name = (getattr(upload, "name", "") or "").lower()
    if not name.endswith(".pdf"):
        return "Допускается только файл в формате PDF."
    head = upload.read(5)
    if hasattr(upload, "seek"):
        upload.seek(0)
    if not head.startswith(b"%PDF"):
        return "Содержимое файла не похоже на PDF."
    return None


@require_http_methods(["GET", "POST"])
def job_apply(request, job_id):
    """
    GET /api/jobs/apply/<job_id>/ — проверка: откликался ли пользователь.
    POST /api/jobs/apply/<job_id>/ — отправить отклик (multipart: cover_letter, resume).
    """
    job = get_object_or_404(JobPosting, pk=job_id, is_active=True)
    if request.method == "GET":
        if not request.user.is_authenticated:
            return JsonResponse({"applied": False})
        app = JobApplication.objects.filter(job=job, applicant=request.user).first()
        if not app:
            return JsonResponse({"applied": False})
        return JsonResponse({"applied": True, "status": app.status})

    if not request.user.is_authenticated:
        return JsonResponse({"error": "Требуется авторизация"}, status=401)
    if getattr(request.user, "is_company_user", False):
        return JsonResponse(
            {"error": "Аккаунт компании не может откликаться на вакансии."},
            status=403,
        )
    if JobApplication.objects.filter(job=job, applicant=request.user).exists():
        return JsonResponse({"error": "Вы уже откликались на эту вакансию"}, status=409)
    cover_letter = (request.POST.get("cover_letter") or "").strip()
    resume_file = request.FILES.get("resume")
    if not resume_file:
        return JsonResponse({"error": "Прикрепите резюме в формате PDF."}, status=400)
    err = _validate_resume_upload(resume_file)
    if err:
        return JsonResponse({"error": err}, status=400)

    app = JobApplication.objects.create(
        job=job,
        applicant=request.user,
        cover_letter=cover_letter,
        resume_url=resume_file,
    )
    job.applications_count = (job.applications_count or 0) + 1
    job.save(update_fields=["applications_count"])

    try:
        from apps.notifications.services import create_notification
        from apps.notifications.models import NotificationType

        create_notification(
            request.user,
            NotificationType.JOB,
            "Отклик отправлен",
            f"Ваш отклик на вакансию «{job.title}» отправлен.",
            link=f"/jobs/{job.pk}",
        )
    except Exception:
        pass

    return JsonResponse({"success": True, "id": app.pk}, status=201)


@require_GET
def my_applications(request):
    """
    GET /api/jobs/my-applications/
    All job applications for the current user with statuses, chat rooms, interviews.
    """
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Требуется авторизация."}, status=401)

    apps = (
        JobApplication.objects.filter(applicant=request.user)
        .select_related("job__company", "chat_room")
        .order_by("-applied_at")
    )
    app_list = list(apps)
    room_ids = [a.chat_room.pk for a in app_list if getattr(a, "chat_room", None)]

    unread_map: dict[int, int] = {}
    interview_map: dict[int, InterviewInvite] = {}
    if room_ids:
        unread_map = {
            row["room_id"]: row["c"]
            for row in (
                ChatMessage.objects.filter(room_id__in=room_ids, is_read=False)
                .exclude(sender=request.user)
                .values("room_id")
                .annotate(c=Count("id"))
            )
        }
        seen_rooms: set[int] = set()
        for inv in (
            InterviewInvite.objects.filter(
                room_id__in=room_ids,
                status__in=[InterviewStatus.PENDING, InterviewStatus.ACCEPTED],
            )
            .select_related("room")
            .order_by("room_id", "scheduled_at")
        ):
            if inv.room_id in seen_rooms:
                continue
            seen_rooms.add(inv.room_id)
            interview_map[inv.room_id] = inv

    data = []
    for a in app_list:
        item = {
            "id": a.pk,
            "status": a.status,
            "applied_at": a.applied_at.isoformat() if a.applied_at else None,
            "cover_letter": a.cover_letter or "",
            "job": {
                "id": a.job.pk,
                **_job_title_payload(a.job),
                "company": a.job.company.company_name,
                "company_logo": a.job.company.logo.url if a.job.company.logo else None,
            },
            "chat_room_id": None,
            "interview": None,
        }
        room = getattr(a, "chat_room", None)
        if room:
            item["chat_room_id"] = room.pk
            item["unread_messages"] = unread_map.get(room.pk, 0)
            upcoming = interview_map.get(room.pk)
            if upcoming:
                item["interview"] = {
                    "id": upcoming.pk,
                    "scheduled_at": upcoming.scheduled_at.isoformat(),
                    "duration_minutes": upcoming.duration_minutes,
                    "format": upcoming.format,
                    "location": upcoming.location,
                    "note": upcoming.note,
                    "status": upcoming.status,
                }
        data.append(item)
    return JsonResponse({"results": data})
