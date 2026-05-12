"""
Django settings for STEM Women Uzbekistan platform.
"""
import os
import warnings
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

_default_secret = "django-insecure-change-me-in-production"
SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY", _default_secret)
if SECRET_KEY == _default_secret and not os.environ.get("DJANGO_DEBUG", "True").lower() in ("1", "true", "yes"):
    warnings.warn("DJANGO_SECRET_KEY is not set! Using insecure default.", stacklevel=1)

DEBUG = os.environ.get("DJANGO_DEBUG", "True").lower() in ("1", "true", "yes")

ALLOWED_HOSTS = ["*"] if DEBUG else os.environ.get("DJANGO_ALLOWED_HOSTS", "localhost,127.0.0.1").split(",")
CHECKIN_PUBLIC_BASE_URL = os.environ.get("CHECKIN_PUBLIC_BASE_URL", "").strip()

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
    "ckeditor",
    "ckeditor_uploader",
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
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
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
    DATABASES = {
        "default": {
            "ENGINE": _DB_ENGINE,
            "NAME": os.environ.get("DATABASE_NAME", "stem"),
            "USER": os.environ.get("DATABASE_USER", "stem"),
            "PASSWORD": os.environ.get("DATABASE_PASSWORD", ""),
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

# CKEditor: форматирование текста и загрузка картинок в контенте новостей
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

# S3/MinIO (django-storages). Use default storage for file fields when configured.
AWS_ACCESS_KEY_ID = os.environ.get("AWS_ACCESS_KEY_ID", "")
AWS_SECRET_ACCESS_KEY = os.environ.get("AWS_SECRET_ACCESS_KEY", "")
AWS_STORAGE_BUCKET_NAME = os.environ.get("AWS_STORAGE_BUCKET_NAME", "")
AWS_S3_ENDPOINT_URL = os.environ.get("AWS_S3_ENDPOINT_URL", "")  # e.g. http://minio:9000
AWS_S3_REGION_NAME = os.environ.get("AWS_S3_REGION_NAME", "us-east-1")
AWS_DEFAULT_ACL = "public-read"
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
}

# Для входа по сессии фронт должен отправлять cookies (credentials).
# При credentials нельзя использовать Allow-Origin: * — указываем явно.
CORS_ALLOW_CREDENTIALS = True
_default_frontend_origins = ",".join([
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://172.16.40.132:5173",
    "http://172.16.40.132:5174",
])
_cors_origins_raw = os.environ.get("DJANGO_CORS_ALLOWED_ORIGINS", _default_frontend_origins)
CORS_ALLOWED_ORIGINS = [o.strip() for o in _cors_origins_raw.split(",") if o.strip()]

_csrf_origins_raw = os.environ.get("DJANGO_CSRF_TRUSTED_ORIGINS", _cors_origins_raw)
CSRF_TRUSTED_ORIGINS = [o.strip() for o in _csrf_origins_raw.split(",") if o.strip()]

# CSRF cookie must be readable by JavaScript for the SPA to send X-CSRFToken header.
CSRF_COOKIE_HTTPONLY = False
CSRF_COOKIE_SAMESITE = "Lax"

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
