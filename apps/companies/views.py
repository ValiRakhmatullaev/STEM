"""
API: список компаний и вакансий для фронта.
Company registration, verified participants for approved companies.
"""
import json
import logging

from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.core.validators import URLValidator
from django.db import transaction
from django.db.models import Count, Q
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.utils.text import slugify
from django.views.decorators.http import require_GET, require_http_methods

from apps.common.audit import record_audit_event
from apps.common.utils import paginate_queryset
from apps.jobs.models import JobApplication, ApplicationStatus
from .models import Company, CompanyUser, CompanyUserRole, JobPosting

logger = logging.getLogger(__name__)
User = get_user_model()
validate_url = URLValidator(schemes=["http", "https"])


def _localized_job_fields(job):
    title = job.title_ru or job.title or job.title_uz or job.title_en or ""
    description = job.description_ru or job.description or job.description_uz or job.description_en or ""
    requirements = job.requirements_ru or job.requirements or job.requirements_uz or job.requirements_en or ""
    return {
        "title": title,
        "title_ru": job.title_ru or job.title or "",
        "title_uz": job.title_uz or "",
        "title_en": job.title_en or "",
        "description": description,
        "description_ru": job.description_ru or job.description or "",
        "description_uz": job.description_uz or "",
        "description_en": job.description_en or "",
        "requirements": requirements,
        "requirements_ru": job.requirements_ru or job.requirements or "",
        "requirements_uz": job.requirements_uz or "",
        "requirements_en": job.requirements_en or "",
    }


@require_GET
def company_list(request):
    """
    GET /api/companies/
    Список компаний из БД (то, что добавлено в админке).
    """
    companies = Company.objects.all().order_by("-created_at")
    page_items, meta = paginate_queryset(request, companies, per_page=50)
    data = [
        {
            "id": c.pk,
            "company_name": c.company_name,
            "slug": c.slug,
            "industry": c.industry,
            "size": c.size,
            "location": c.location,
            "is_verified": c.is_verified,
            "description": (c.description or "")[:200],
            "logo": c.logo.url if c.logo else None,
        }
        for c in page_items
    ]
    return JsonResponse({"results": data, "pagination": meta})


@require_GET
def job_list(request):
    """
    GET /api/jobs/
    Список активных вакансий с данными компании.
    """
    jobs_qs = (
        JobPosting.objects.filter(is_active=True)
        .select_related("company")
        .order_by("-published_at", "-created_at")
    )
    page_items, meta = paginate_queryset(request, jobs_qs, per_page=50)
    data = []
    for j in page_items:
        published = j.published_at or j.created_at
        localized = _localized_job_fields(j)
        data.append({
            "id": j.pk,
            **localized,
            "slug": j.slug,
            "description": localized["description"][:300],
            "description_ru": localized["description_ru"][:300],
            "description_uz": localized["description_uz"][:300],
            "description_en": localized["description_en"][:300],
            "company": j.company.company_name,
            "company_industry": j.company.industry,
            "location": j.company.location,
            "location_type": j.location_type,
            "experience_level": j.experience_level,
            "employment_type": j.employment_type,
            "published_at": published.isoformat() if published else None,
            "salary_min": str(j.salary_min) if j.salary_min else None,
            "salary_max": str(j.salary_max) if j.salary_max else None,
            "apply_url": j.apply_url,
        })
    return JsonResponse({"results": data, "pagination": meta})


@require_GET
def job_detail(request, pk):
    """
    GET /api/companies/jobs/<id>/
    Одна вакансия по id с полным описанием и данными компании.
    """
    job = get_object_or_404(
        JobPosting.objects.filter(is_active=True).select_related("company"),
        pk=pk,
    )
    published = job.published_at or job.created_at
    localized = _localized_job_fields(job)
    data = {
        "id": job.pk,
        **localized,
        "slug": job.slug,
        "experience_level": job.experience_level,
        "employment_type": job.employment_type,
        "location_type": job.location_type,
        "salary_min": str(job.salary_min) if job.salary_min is not None else None,
        "salary_max": str(job.salary_max) if job.salary_max is not None else None,
        "apply_url": job.apply_url,
        "published_at": published.isoformat() if published else None,
        "company": {
            "id": job.company_id,
            "company_name": job.company.company_name,
            "slug": job.company.slug,
        },
    }
    return JsonResponse(data)


@require_GET
def company_detail(request, pk):
    """
    GET /api/companies/<id>/
    Одна компания по id + активные вакансии.
    """
    company = get_object_or_404(Company, pk=pk)
    jobs = (
        JobPosting.objects.filter(company=company, is_active=True)
        .order_by("-published_at", "-created_at")
    )
    job_list_data = [
        {
            "id": j.pk,
            **_localized_job_fields(j),
            "slug": j.slug,
            "location_type": j.location_type,
            "experience_level": j.experience_level,
            "employment_type": j.employment_type,
            "published_at": (j.published_at or j.created_at).isoformat() if (j.published_at or j.created_at) else None,
        }
        for j in jobs
    ]
    data = {
        "id": company.pk,
        "company_name": company.company_name,
        "slug": company.slug,
        "industry": company.industry,
        "size": company.size,
        "location": company.location,
        "is_verified": company.is_verified,
        "description": company.description or "",
        "website": company.website or "",
        "logo": company.logo.url if company.logo else None,
        "jobs": job_list_data,
    }
    return JsonResponse(data)


@require_http_methods(["POST"])
def company_register(request):
    """
    POST /api/companies/register/
    Register a new company account.
    Creates a User (is_company_user=True) + Company + CompanyUser link.
    Body: {
        "username": "...", "email": "...", "password": "...",
        "company_name": "...", "industry": "...", "size": "...",
        "location": "...", "website": "...", "description": "..."
    }
    """
    try:
        data = json.loads(request.body)
    except (json.JSONDecodeError, TypeError):
        return JsonResponse({"message": "Некорректный JSON"}, status=400)

    username = (data.get("username") or "").strip().lower()
    email = (data.get("email") or "").strip()
    password = data.get("password") or ""
    company_name = (data.get("company_name") or "").strip()
    industry = (data.get("industry") or "").strip()
    size = (data.get("size") or "").strip()
    location = (data.get("location") or "").strip()
    website = (data.get("website") or "").strip()
    description = (data.get("description") or "").strip()

    field_errors = {}

    if not username:
        field_errors["username"] = "Логин обязателен."
    elif len(username) < 3:
        field_errors["username"] = "Логин минимум 3 символа."
    elif User.objects.filter(username=username).exists():
        field_errors["username"] = "Логин занят."

    if not email:
        field_errors["email"] = "Email обязателен."
    elif User.objects.filter(email=email).exists():
        field_errors["email"] = "Email уже зарегистрирован."

    if len(password) < 8:
        field_errors["password"] = "Пароль минимум 8 символов."

    if not company_name:
        field_errors["company_name"] = "Название компании обязательно."

    if not industry:
        field_errors["industry"] = "Отрасль обязательна."

    if not size:
        field_errors["size"] = "Размер компании обязателен."

    if not location:
        field_errors["location"] = "Местоположение обязательно."

    if field_errors:
        return JsonResponse({
            "message": "Проверьте заполнение формы.",
            "errors": list(field_errors.values()),
            "field_errors": field_errors,
        }, status=400)

    try:
        with transaction.atomic():
            user = User(
                username=username,
                email=email or None,
                is_company_user=True,
            )
            user.set_password(password)
            user.save()

            slug = slugify(company_name)
            base_slug = slug or "company"
            counter = 1
            while Company.objects.filter(slug=slug).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1

            company = Company.objects.create(
                company_name=company_name,
                slug=slug,
                industry=industry,
                size=size,
                location=location,
                website=website,
                description=description,
            )

            CompanyUser.objects.create(
                user=user,
                company=company,
                role=CompanyUserRole.ADMIN,
            )
    except Exception:
        logger.exception("Company registration error")
        return JsonResponse({"message": "Внутренняя ошибка сервера."}, status=500)

    return JsonResponse({
        "message": "Компания зарегистрирована. Ожидайте одобрения администратора для доступа к участникам.",
        "user": {
            "id": str(user.pk),
            "username": user.username,
            "email": user.email or "",
        },
        "company": {
            "id": company.pk,
            "company_name": company.company_name,
        },
    }, status=201)


@require_GET
def company_me(request):
    """
    GET /api/companies/me/
    Return company info for the currently logged-in company user.
    """
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Требуется авторизация."}, status=401)

    if not getattr(request.user, "is_company_user", False):
        return JsonResponse({"error": "Аккаунт не является компанией."}, status=403)

    membership = (
        CompanyUser.objects.filter(user=request.user, is_active=True)
        .select_related("company")
        .first()
    )
    if not membership:
        return JsonResponse({"error": "Компания не найдена."}, status=404)

    c = membership.company
    return JsonResponse({
        "company": {
            "id": c.pk,
            "company_name": c.company_name,
            "slug": c.slug,
            "industry": c.industry,
            "size": c.size,
            "location": c.location,
            "is_verified": c.is_verified,
            "is_approved_for_talents": c.is_approved_for_talents,
            "description": c.description or "",
            "website": c.website or "",
            "logo": c.logo.url if c.logo else None,
        },
        "role": membership.role,
    })


@require_GET
def company_verified_participants(request):
    """
    GET /api/companies/talents/
    List verified participants — only for approved company users.
    """
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Требуется авторизация."}, status=401)

    if not getattr(request.user, "is_company_user", False):
        return JsonResponse({"error": "Аккаунт не является компанией."}, status=403)

    membership = (
        CompanyUser.objects.filter(user=request.user, is_active=True)
        .select_related("company")
        .first()
    )
    if not membership:
        return JsonResponse({"error": "Компания не найдена."}, status=404)

    if not membership.company.is_approved_for_talents:
        return JsonResponse({
            "error": "Доступ к участникам ещё не одобрен администратором.",
            "pending_approval": True,
        }, status=403)

    record_audit_event(
        request,
        "company.view_verified_talents",
        target_type="company",
        target_id=membership.company_id,
        metadata={"company_user_id": request.user.pk},
    )

    verified_users = (
        User.objects.filter(is_verified=True, is_active=True, is_company_user=False)
        .exclude(is_staff=True)
        .exclude(is_superuser=True)
        .annotate(
            total_checkins=Count(
                "event_registrations",
                filter=Q(event_registrations__checked_in=True),
            )
        )
        .order_by("first_name", "last_name")
    )

    participants = []
    for u in verified_users[:500]:
        participants.append({
            "id": u.pk,
            "first_name": u.first_name or "",
            "last_name": u.last_name or "",
            "display_name": u.display_name,
            "email": u.email or "",
            "phone": u.phone or "",
            "city": u.city or "",
            "education_status": u.education_status or "",
            "university": u.university or "",
            "bio": u.bio or "",
            "total_checkins": int(getattr(u, "total_checkins", 0) or 0),
            "cv_file": request.build_absolute_uri(u.cv_file.url) if u.cv_file else None,
            "profile_photo": request.build_absolute_uri(u.profile_photo.url) if u.profile_photo else None,
        })

    return JsonResponse({"results": participants})


def _get_company_membership(request):
    """Helper: returns (membership, error_response). If error, membership is None."""
    if not request.user.is_authenticated:
        return None, JsonResponse({"error": "Требуется авторизация."}, status=401)
    if not getattr(request.user, "is_company_user", False):
        return None, JsonResponse({"error": "Аккаунт не является компанией."}, status=403)
    membership = (
        CompanyUser.objects.filter(user=request.user, is_active=True)
        .select_related("company")
        .first()
    )
    if not membership:
        return None, JsonResponse({"error": "Компания не найдена."}, status=404)
    return membership, None


@require_GET
def company_my_jobs(request):
    """
    GET /api/companies/my-jobs/
    List all jobs for the current company user.
    """
    membership, err = _get_company_membership(request)
    if err:
        return err

    company = membership.company
    jobs = (
        JobPosting.objects.filter(company=company)
        .annotate(
            _apps_total=Count("applications"),
            _apps_new=Count("applications", filter=Q(applications__status=ApplicationStatus.NEW)),
        )
        .order_by("-created_at")
    )
    data = []
    for j in jobs:
        localized = _localized_job_fields(j)
        data.append({
            "id": j.pk,
            **localized,
            "slug": j.slug,
            "description": localized["description"][:200],
            "description_ru": localized["description_ru"][:200],
            "description_uz": localized["description_uz"][:200],
            "description_en": localized["description_en"][:200],
            "experience_level": j.experience_level,
            "employment_type": j.employment_type,
            "location_type": j.location_type,
            "salary_min": str(j.salary_min) if j.salary_min else None,
            "salary_max": str(j.salary_max) if j.salary_max else None,
            "apply_url": j.apply_url,
            "is_active": j.is_active,
            "published_at": (j.published_at or j.created_at).isoformat() if (j.published_at or j.created_at) else None,
            "applications_count": int(getattr(j, "_apps_total", 0) or 0),
            "new_applications": int(getattr(j, "_apps_new", 0) or 0),
        })
    return JsonResponse({"results": data})


@require_http_methods(["POST"])
def company_create_job(request):
    """
    POST /api/companies/my-jobs/create/
    Create a new job posting.
    """
    membership, err = _get_company_membership(request)
    if err:
        return err

    try:
        body = json.loads(request.body)
    except (json.JSONDecodeError, TypeError):
        return JsonResponse({"error": "Некорректный JSON."}, status=400)

    title = (body.get("title") or "").strip()
    description = (body.get("description") or "").strip()
    requirements = (body.get("requirements") or "").strip()
    experience_level = (body.get("experience_level") or "").strip()
    employment_type = (body.get("employment_type") or "").strip()
    location_type = (body.get("location_type") or "").strip()
    salary_min = body.get("salary_min")
    salary_max = body.get("salary_max")
    apply_url = (body.get("apply_url") or "").strip()

    errors = {}
    if not title:
        errors["title"] = "Название вакансии обязательно."
    if not description:
        errors["description"] = "Описание обязательно."
    if not experience_level:
        errors["experience_level"] = "Уровень опыта обязателен."
    if not employment_type:
        errors["employment_type"] = "Тип занятости обязателен."
    if not location_type:
        errors["location_type"] = "Формат работы обязателен."
    if apply_url:
        try:
            validate_url(apply_url)
        except ValidationError:
            errors["apply_url"] = "Укажите корректную ссылку, например https://company.com/jobs/123."
    if errors:
        return JsonResponse({"error": "Проверьте заполнение формы.", "field_errors": errors}, status=400)

    slug = slugify(title)
    base_slug = slug or "job"
    counter = 1
    while JobPosting.objects.filter(slug=slug).exists():
        slug = f"{base_slug}-{counter}"
        counter += 1

    job = JobPosting.objects.create(
        company=membership.company,
        title=title,
        slug=slug,
        description=description,
        requirements=requirements,
        experience_level=experience_level,
        employment_type=employment_type,
        location_type=location_type,
        salary_min=salary_min if salary_min else None,
        salary_max=salary_max if salary_max else None,
        apply_url=apply_url,
        is_active=True,
        published_at=timezone.now(),
    )
    return JsonResponse({"success": True, "id": job.pk}, status=201)


@require_http_methods(["POST"])
def company_toggle_job(request, job_id):
    """
    POST /api/companies/my-jobs/<id>/toggle/
    Toggle is_active for a job.
    """
    membership, err = _get_company_membership(request)
    if err:
        return err

    job = get_object_or_404(JobPosting, pk=job_id, company=membership.company)
    job.is_active = not job.is_active
    job.save(update_fields=["is_active"])
    return JsonResponse({"success": True, "is_active": job.is_active})


@require_GET
def company_job_applicants(request, job_id):
    """
    GET /api/companies/my-jobs/<id>/applicants/
    List applicants for a specific job.
    """
    membership, err = _get_company_membership(request)
    if err:
        return err

    job = get_object_or_404(JobPosting, pk=job_id, company=membership.company)
    apps = (
        JobApplication.objects.filter(job=job)
        .select_related("applicant")
        .order_by("-applied_at")
    )
    data = []
    for a in apps:
        u = a.applicant
        data.append({
            "id": a.pk,
            "status": a.status,
            "applied_at": a.applied_at.isoformat() if a.applied_at else None,
            "cover_letter": a.cover_letter or "",
            "resume_url": request.build_absolute_uri(a.resume_url.url) if a.resume_url else None,
            "applicant": {
                "id": u.pk,
                "full_name": u.get_full_name() or u.display_name or u.username,
                "email": u.email or "",
                "phone": u.phone or "",
                "city": u.city or "",
                "university": u.university or "",
                "is_verified": u.is_verified,
                "profile_photo": request.build_absolute_uri(u.profile_photo.url) if u.profile_photo else None,
                "cv_file": request.build_absolute_uri(u.cv_file.url) if u.cv_file else None,
            },
        })
    return JsonResponse({"job_title": job.title, "results": data})


@require_http_methods(["POST"])
def company_update_applicant(request, application_id):
    """
    POST /api/companies/applicants/<id>/status/
    Update application status: {"status": "shortlisted" | "rejected" | "hired" | "viewed"}
    """
    membership, err = _get_company_membership(request)
    if err:
        return err

    application = get_object_or_404(
        JobApplication.objects.select_related("job"),
        pk=application_id,
        job__company=membership.company,
    )

    try:
        body = json.loads(request.body)
    except (json.JSONDecodeError, TypeError):
        return JsonResponse({"error": "Некорректный JSON."}, status=400)

    new_status = (body.get("status") or "").strip()
    valid = [s[0] for s in ApplicationStatus.choices]
    if new_status not in valid:
        return JsonResponse({"error": f"Недопустимый статус. Допустимые: {valid}"}, status=400)

    application.status = new_status
    application.save(update_fields=["status"])

    # Auto-create ChatRoom when hired
    chat_room_id = None
    if new_status == "hired":
        try:
            from apps.chat.models import ChatRoom, ChatMessage
            room, created = ChatRoom.objects.get_or_create(
                application=application,
                defaults={
                    "company_user": request.user,
                    "candidate": application.applicant,
                },
            )
            chat_room_id = room.pk
            if created:
                ChatMessage.objects.create(
                    room=room,
                    sender=request.user,
                    text=f"🎉 Добро пожаловать! Ваш отклик на «{application.job.title}» принят. Давайте обсудим дальнейшие шаги.",
                )
        except Exception:
            pass

    try:
        from apps.notifications.services import create_notification
        from apps.notifications.models import NotificationType
        status_labels = {
            "shortlisted": "в шорт-лист",
            "rejected": "отклонён",
            "hired": "принят",
            "viewed": "просмотрен",
        }
        label = status_labels.get(new_status, new_status)
        notif_link = "/my-applications" if new_status == "hired" else f"/jobs/{application.job.pk}"
        create_notification(
            application.applicant,
            NotificationType.JOB,
            "Статус отклика обновлён",
            f"Ваш отклик на «{application.job.title}» — {label}.",
            link=notif_link,
        )
    except Exception:
        pass

    result = {"success": True, "status": application.status}
    if chat_room_id:
        result["chat_room_id"] = chat_room_id
    return JsonResponse(result)


@require_GET
def company_all_applicants(request):
    """
    GET /api/companies/my-applicants/
    All applicants across all company jobs.
    """
    membership, err = _get_company_membership(request)
    if err:
        return err

    apps = (
        JobApplication.objects.filter(job__company=membership.company)
        .select_related("applicant", "job")
        .order_by("-applied_at")
    )
    data = []
    for a in apps:
        u = a.applicant
        data.append({
            "id": a.pk,
            "status": a.status,
            "applied_at": a.applied_at.isoformat() if a.applied_at else None,
            "cover_letter": a.cover_letter or "",
            "resume_url": request.build_absolute_uri(a.resume_url.url) if a.resume_url else None,
            "job": {
                "id": a.job.pk,
                "title": _localized_job_fields(a.job)["title"],
                "title_ru": _localized_job_fields(a.job)["title_ru"],
                "title_uz": _localized_job_fields(a.job)["title_uz"],
                "title_en": _localized_job_fields(a.job)["title_en"],
            },
            "applicant": {
                "id": u.pk,
                "full_name": u.get_full_name() or u.display_name or u.username,
                "email": u.email or "",
                "phone": u.phone or "",
                "city": u.city or "",
                "university": u.university or "",
                "is_verified": u.is_verified,
                "profile_photo": request.build_absolute_uri(u.profile_photo.url) if u.profile_photo else None,
                "cv_file": request.build_absolute_uri(u.cv_file.url) if u.cv_file else None,
            },
        })
    return JsonResponse({"results": data})


@require_GET
def company_dashboard_stats(request):
    """
    GET /api/companies/dashboard/
    Stats for the company dashboard.
    """
    membership, err = _get_company_membership(request)
    if err:
        return err

    company = membership.company
    jobs = JobPosting.objects.filter(company=company)
    total_jobs = jobs.count()
    active_jobs = jobs.filter(is_active=True).count()
    total_applications = JobApplication.objects.filter(job__company=company).count()
    new_applications = JobApplication.objects.filter(job__company=company, status=ApplicationStatus.NEW).count()
    shortlisted = JobApplication.objects.filter(job__company=company, status=ApplicationStatus.SHORTLISTED).count()

    return JsonResponse({
        "total_jobs": total_jobs,
        "active_jobs": active_jobs,
        "total_applications": total_applications,
        "new_applications": new_applications,
        "shortlisted": shortlisted,
        "is_approved_for_talents": company.is_approved_for_talents,
    })
