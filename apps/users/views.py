"""
API: регистрация, вход, выход, текущий пользователь.
"""
import json
import logging

from django.contrib.auth import authenticate, get_user_model, login, logout
from django.db import transaction
from django.http import JsonResponse
from django.middleware.csrf import get_token
from django.utils import timezone
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_http_methods, require_GET
from django_ratelimit.decorators import ratelimit

logger = logging.getLogger(__name__)

User = get_user_model()
PERSONAL_DATA_CONSENT_VERSION = "personal-data-v1"


def _truthy(value) -> bool:
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return value.strip().lower() in {"1", "true", "yes", "on"}
    return False


def _client_ip(request) -> str | None:
    forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR", "")
    if forwarded_for:
        return forwarded_for.split(",", 1)[0].strip() or None
    return request.META.get("REMOTE_ADDR")


@ratelimit(key="ip", rate="30/h", method="POST")
@require_http_methods(["POST"])
def register(request):
    """
    POST /api/auth/register/
    Body: {
      "username": "...",
      "email": "...",
      "password": "...",
      "first_name": "...",
      "last_name": "...",
      "age": 18,
      "city": "...",
      "phone": "...",
      "education_status": "student|graduate|not_studying",
      "university": "..." (required if student/graduate),
      "personal_data_consent": true
    }
    """
    try:
        data = json.loads(request.body)
    except (json.JSONDecodeError, TypeError):
        return JsonResponse({"message": "Некорректный JSON"}, status=400)

    username = (data.get("username") or "").strip().lower()
    password = data.get("password") or ""
    email = (data.get("email") or "").strip()
    first_name = (data.get("first_name") or "").strip()
    last_name = (data.get("last_name") or "").strip()
    city = (data.get("city") or "").strip()
    phone = (data.get("phone") or "").strip()
    education_status = (data.get("education_status") or "").strip()
    university = (data.get("university") or "").strip()
    personal_data_consent = _truthy(data.get("personal_data_consent"))

    age_raw = data.get("age")
    try:
        age = int(age_raw) if age_raw is not None and str(age_raw).strip() != "" else None
    except (TypeError, ValueError):
        age = None

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

    if not first_name:
        field_errors["first_name"] = "Имя обязательно."
    if not last_name:
        field_errors["last_name"] = "Фамилия обязательна."
    if age is None:
        field_errors["age"] = "Возраст обязателен."
    elif age < 10 or age > 120:
        field_errors["age"] = "Возраст должен быть в диапазоне 10-120."
    if not city:
        field_errors["city"] = "Город обязателен."
    if not phone:
        field_errors["phone"] = "Номер телефона обязателен."
    elif len(phone) < 7:
        field_errors["phone"] = "Номер телефона слишком короткий."
    if len(password) < 8:
        field_errors["password"] = "Пароль минимум 8 символов."

    if not personal_data_consent:
        field_errors["personal_data_consent"] = "Consent to personal data processing is required."

    if education_status not in {
        getattr(User, "EDUCATION_STUDENT", "student"),
        getattr(User, "EDUCATION_GRADUATE", "graduate"),
        getattr(User, "EDUCATION_NOT_STUDYING", "not_studying"),
    }:
        field_errors["education_status"] = "Выберите статус обучения."

    if education_status in {getattr(User, "EDUCATION_STUDENT", "student"), getattr(User, "EDUCATION_GRADUATE", "graduate")}:
        if not university:
            field_errors["university"] = "Университет обязателен для студента/выпускницы."

    if field_errors:
        return JsonResponse(
            {
                "message": "Проверьте заполнение формы.",
                "errors": list(field_errors.values()),
                "field_errors": field_errors,
            },
            status=400,
        )

    try:
        with transaction.atomic():
            user = User(
                username=username,
                email=email or None,
                first_name=first_name,
                last_name=last_name,
                phone=phone,
                age=age,
                city=city,
                education_status=education_status,
                university=university if education_status in {"student", "graduate"} else None,
                personal_data_consent=True,
                personal_data_consent_at=timezone.now(),
                personal_data_consent_version=PERSONAL_DATA_CONSENT_VERSION,
                personal_data_consent_ip=_client_ip(request),
            )
            user.set_password(password)
            user.save()
    except Exception:
        logger.exception("Registration error")
        return JsonResponse({"message": "Внутренняя ошибка сервера."}, status=500)

    return JsonResponse(
        {
            "message": "Регистрация успешна.",
            "user": {
                "id": str(user.pk),
                "username": user.username,
                "email": user.email or "",
            },
        },
        status=201,
    )


@ratelimit(key="ip", rate="40/m", method="POST")
@require_http_methods(["POST"])
def login_view(request):
    """
    POST /api/auth/login/
    Body: { "username": "...", "password": "..." }
    """
    try:
        data = json.loads(request.body)
    except (json.JSONDecodeError, TypeError):
        return JsonResponse({"message": "Некорректный JSON"}, status=400)

    raw_username = (data.get("username") or "").strip()
    password = data.get("password") or ""

    if not raw_username or not password:
        return JsonResponse({"message": "Укажите логин и пароль."}, status=400)

    try:
        u_obj = User.objects.get(username__iexact=raw_username)
        username = u_obj.username
    except User.DoesNotExist:
        username = raw_username.lower()

    user = authenticate(request, username=username, password=password)
    if user is None:
        return JsonResponse({"message": "Неверный логин или пароль."}, status=401)

    login(request, user)
    user.record_login()

    return JsonResponse({
        "message": "Вход выполнен.",
        "user": {
            "id": str(user.pk),
            "username": user.username,
            "email": user.email or "",
            "display_name": user.display_name,
            "is_profile_complete": user.has_complete_profile(),
            "is_staff": user.is_staff,
            "is_presence_checker": getattr(user, "is_presence_checker", False),
            "is_verified": getattr(user, "is_verified", False),
            "is_company_user": getattr(user, "is_company_user", False),
        },
    })


@ensure_csrf_cookie
@require_GET
def me(request):
    """
    GET /api/auth/me/
    """
    if not request.user.is_authenticated:
        return JsonResponse({"message": "Не авторизован."}, status=401)

    user = request.user
    return JsonResponse({
        "user": {
            "id": str(user.pk),
            "username": user.username,
            "email": user.email or "",
            "display_name": user.display_name,
            "initials": user.initials,
            "avatar": user.avatar.url if user.avatar else None,
            "is_verified_email": user.is_verified_email,
            "is_verified": getattr(user, "is_verified", False),
            "is_company_user": getattr(user, "is_company_user", False),
            "profile_complete": user.has_complete_profile(),
            "is_staff": user.is_staff,
            "is_presence_checker": getattr(user, "is_presence_checker", False),
        },
    })


@ratelimit(key="ip", rate="60/m", method="POST")
@require_http_methods(["POST"])
def logout_view(request):
    logout(request)
    return JsonResponse({"message": "Выход выполнен."})


@ensure_csrf_cookie
@require_GET
def csrf_token_view(request):
    """GET /api/auth/csrf/ — set the CSRF cookie and return a token for SPA forms."""
    return JsonResponse({"csrfToken": get_token(request)})
