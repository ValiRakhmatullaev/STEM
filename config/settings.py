"""
Django settings for STEM Woman Uzbekistan platform.

Security and operations behaviour is driven by environment variables.
See `.env.example` for production-oriented defaults documentation.
"""
from __future__ import annotations

import os
import sys
import warnings
from pathlib import Path

from django.core.exceptions import ImproperlyConfigured

BASE_DIR = Path(__file__).resolve().parent.parent


def _env_bool(name: str, default: bool = False) -> bool:
    raw = os.environ.get(name)
    if raw is None:
        return default
    return raw.strip().lower() in ("1", "true", "yes", "on")


_default_secret = "django-insecure-change-me-in-production"
SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY", _default_secret)

DEBUG = _env_bool("DJANGO_DEBUG", True)

_weak_secret_values = {
    "",
    "change-me",
    "changeme",
    "your-secret-key-here",
    "your-super-secret-key-here-generate-with-python-secrets",
    "replace-with-50-plus-character-random-secret-before-running-production",
    _default_secret,
}


def _is_weak_secret(value: str) -> bool:
    return (
        value.strip() in _weak_secret_values
        or value.startswith("django-insecure-")
        or len(value) < 50
        or len(set(value)) < 8
    )


if not DEBUG and _is_weak_secret(SECRET_KEY):
    raise ImproperlyConfigured(
        "DJANGO_SECRET_KEY must be a high-entropy value with at least 50 characters when DJANGO_DEBUG is false."
    )

if SECRET_KEY == _default_secret and DEBUG:
    warnings.warn(
        "DJANGO_SECRET_KEY is not set; using insecure development default.",
        stacklevel=1,
    )

ALLOWED_HOSTS = (
    ["*"]
    if DEBUG
    else [h.strip() for h in os.environ.get("DJANGO_ALLOWED_HOSTS", "localhost,127.0.0.1").split(",") if h.strip()]
)

CHECKIN_PUBLIC_BASE_URL = os.environ.get("CHECKIN_PUBLIC_BASE_URL", "").strip()
SITE_PUBLIC_BASE_URL = os.environ.get("SITE_PUBLIC_BASE_URL", CHECKIN_PUBLIC_BASE_URL).strip()

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # Third-party
    "rest_framework",
    "corsheaders",
    "django_extensions",
    # Local apps
    "apps.common",
    "apps.users",
    "apps.content",
    "apps.skills",
    "apps.companies",
    "apps.events",
    "apps.career_fairs",
    "apps.notifications",
    "apps.jobs",
    "apps.chat",
    "apps.admin_dashboard",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "apps.common.middleware.RequestIdMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "apps.common.middleware.SecurityHeadersMiddleware",
]

ROOT_URLCONF = "config.urls"

WSGI_APPLICATION = "config.wsgi.application"

_DB_ENGINE = os.environ.get("DATABASE_ENGINE", "django.db.backends.sqlite3")
if _DB_ENGINE == "django.db.backends.sqlite3":
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }
else:
    _db_password = os.environ.get("DATABASE_PASSWORD", "")
    if not DEBUG and (_db_password in {"", "stem", "password", "change-me", "replace-with-strong-random-database-password"} or len(_db_password) < 12):
        raise ImproperlyConfigured("DATABASE_PASSWORD must be strong when DJANGO_DEBUG is false.")
    DATABASES = {
        "default": {
            "ENGINE": _DB_ENGINE,
            "NAME": os.environ.get("DATABASE_NAME", "stem"),
            "USER": os.environ.get("DATABASE_USER", "stem"),
            "PASSWORD": _db_password,
            "HOST": os.environ.get("DATABASE_HOST", "localhost"),
            "PORT": os.environ.get("DATABASE_PORT", "5432"),
        }
    }

AUTH_USER_MODEL = "users.User"

LANGUAGE_CODE = "en-us"
TIME_ZONE = "Asia/Tashkent"
USE_I18N = True
USE_TZ = True

STATIC_URL = "/static/"
STATIC_ROOT = Path(os.environ.get("DJANGO_STATIC_ROOT", str(BASE_DIR / "staticfiles")))

MEDIA_URL = "/media/"
MEDIA_ROOT = Path(os.environ.get("DJANGO_MEDIA_ROOT", str(BASE_DIR / "media")))

CKEDITOR_UPLOAD_PATH = "uploads/"
CKEDITOR_IMAGE_BACKEND = "pillow"
CKEDITOR_CONFIGS = {
    "default": {
        "toolbar": "full",
        "height": 400,
        "extraPlugins": "uploadimage",
        "removePlugins": "stylesheetparser",
    },
}

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# --- Cache (rate limits + future hot paths). Use Redis in multi-worker production. ---
_redis_url = os.environ.get("REDIS_URL", "").strip()
if _redis_url:
    CACHES = {
        "default": {
            "BACKEND": "django.core.cache.backends.redis.RedisCache",
            "LOCATION": _redis_url,
        }
    }
else:
    CACHES = {
        "default": {
            "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
            "LOCATION": "stem-platform-locmem",
        }
    }

# django-ratelimit: view invoked when limit exceeded
RATELIMIT_VIEW = "config.ratelimit_handlers.ratelimited_error"

# S3/MinIO (django-storages)
AWS_ACCESS_KEY_ID = os.environ.get("AWS_ACCESS_KEY_ID", "")
AWS_SECRET_ACCESS_KEY = os.environ.get("AWS_SECRET_ACCESS_KEY", "")
AWS_STORAGE_BUCKET_NAME = os.environ.get("AWS_STORAGE_BUCKET_NAME", "")
AWS_S3_ENDPOINT_URL = os.environ.get("AWS_S3_ENDPOINT_URL", "")
AWS_S3_REGION_NAME = os.environ.get("AWS_S3_REGION_NAME", "us-east-1")
# Private-by-default; use bucket policy / CloudFront for public assets if needed.
AWS_DEFAULT_ACL = os.environ.get("AWS_S3_DEFAULT_ACL", "private")
AWS_S3_OBJECT_PARAMETERS = {"CacheControl": "max-age=86400"}

if AWS_ACCESS_KEY_ID and AWS_STORAGE_BUCKET_NAME:
    DEFAULT_FILE_STORAGE = "storages.backends.s3boto3.S3Boto3Storage"
    if AWS_S3_ENDPOINT_URL:
        AWS_S3_CUSTOM_DOMAIN = None

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.SessionAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticatedOrReadOnly",
    ],
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 50,
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "anon": os.environ.get("DRF_THROTTLE_ANON", "120/minute"),
        "user": os.environ.get("DRF_THROTTLE_USER", "600/minute"),
    },
}

CORS_ALLOW_CREDENTIALS = True
_default_frontend_origins = ",".join(
    [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ]
)
_cors_origins_raw = os.environ.get("DJANGO_CORS_ALLOWED_ORIGINS", _default_frontend_origins)
CORS_ALLOWED_ORIGINS = [o.strip() for o in _cors_origins_raw.split(",") if o.strip()]

_csrf_origins_raw = os.environ.get("DJANGO_CSRF_TRUSTED_ORIGINS", _cors_origins_raw)
CSRF_TRUSTED_ORIGINS = [o.strip() for o in _csrf_origins_raw.split(",") if o.strip()]

CSRF_COOKIE_HTTPONLY = False
CSRF_COOKIE_SAMESITE = "Lax"

_secure_cookies = _env_bool("DJANGO_SECURE_COOKIES", not DEBUG)

SESSION_COOKIE_SECURE = _secure_cookies
CSRF_COOKIE_SECURE = _secure_cookies
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = "Lax"

SECURE_SSL_REDIRECT = _env_bool("DJANGO_SECURE_SSL_REDIRECT", not DEBUG)
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SECURE_HSTS_SECONDS = int(os.environ.get("DJANGO_SECURE_HSTS_SECONDS", "31536000" if not DEBUG else "0"))
SECURE_HSTS_INCLUDE_SUBDOMAINS = _env_bool("DJANGO_SECURE_HSTS_INCLUDE_SUBDOMAINS", not DEBUG)
SECURE_HSTS_PRELOAD = _env_bool("DJANGO_SECURE_HSTS_PRELOAD", False)
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_REFERRER_POLICY = "same-origin"
X_FRAME_OPTIONS = "DENY"

EMAIL_BACKEND = os.environ.get("DJANGO_EMAIL_BACKEND", "django.core.mail.backends.console.EmailBackend" if DEBUG else "django.core.mail.backends.smtp.EmailBackend")
EMAIL_HOST = os.environ.get("DJANGO_EMAIL_HOST", "")
EMAIL_PORT = int(os.environ.get("DJANGO_EMAIL_PORT", "587"))
EMAIL_HOST_USER = os.environ.get("DJANGO_EMAIL_HOST_USER", "")
EMAIL_HOST_PASSWORD = os.environ.get("DJANGO_EMAIL_HOST_PASSWORD", "")
EMAIL_USE_TLS = _env_bool("DJANGO_EMAIL_USE_TLS", True)
EMAIL_USE_SSL = _env_bool("DJANGO_EMAIL_USE_SSL", False)
DEFAULT_FROM_EMAIL = os.environ.get("DJANGO_DEFAULT_FROM_EMAIL", "STEM Woman Uzbekistan <info@stemwoman.uz>")

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "stem": {
            "format": "%(asctime)s %(levelname)s [%(name)s] %(message)s",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "stream": sys.stdout,
            "formatter": "stem",
        },
    },
    "root": {
        "handlers": ["console"],
        "level": os.environ.get("DJANGO_LOG_LEVEL", "INFO"),
    },
    "loggers": {
        "django.request": {"handlers": ["console"], "level": "INFO", "propagate": False},
        "django.security": {"handlers": ["console"], "level": "WARNING", "propagate": False},
    },
}
