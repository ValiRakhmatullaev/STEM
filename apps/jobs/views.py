"""
API: отклик на вакансию (резюме + сопроводительное письмо).
"""
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.views.decorators.http import require_GET, require_http_methods

from apps.companies.models import JobPosting
from .models import JobApplication


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
        .select_related("job__company")
        .order_by("-applied_at")
    )
    data = []
    for a in apps:
        item = {
            "id": a.pk,
            "status": a.status,
            "applied_at": a.applied_at.isoformat() if a.applied_at else None,
            "cover_letter": a.cover_letter or "",
            "job": {
                "id": a.job.pk,
                "title": a.job.title,
                "company": a.job.company.company_name,
                "company_logo": a.job.company.logo.url if a.job.company.logo else None,
            },
            "chat_room_id": None,
            "interview": None,
        }
        # Check for chat room
        try:
            from apps.chat.models import ChatRoom, InterviewInvite, InterviewStatus
            room = ChatRoom.objects.filter(application=a, is_active=True).first()
            if room:
                item["chat_room_id"] = room.pk
                unread = room.messages.filter(is_read=False).exclude(sender=request.user).count()
                item["unread_messages"] = unread
                upcoming = room.interviews.filter(
                    status__in=[InterviewStatus.PENDING, InterviewStatus.ACCEPTED]
                ).order_by("scheduled_at").first()
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
        except Exception:
            pass
        data.append(item)
    return JsonResponse({"results": data})
