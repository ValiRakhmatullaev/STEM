"""
User system for STEM Women Uzbekistan.
Один тип пользователя; админ — через is_staff / is_superuser в Django.
"""
from __future__ import annotations

from django.contrib.auth.models import AbstractUser
from django.db import models
from django.urls import reverse
from django.utils import timezone

from apps.common.models import TimeStampedModel
from apps.common.validators import validate_image_upload, validate_pdf_upload


class User(AbstractUser, TimeStampedModel):
    """
    Пользователь: логин (username), пароль, email, профиль.
    Админ: создаётся через createsuperuser (is_staff=True, is_superuser=True).
    """

    email = models.EmailField("email address", unique=True, blank=True, null=True)
    first_name = models.CharField(max_length=150, blank=True)
    last_name = models.CharField(max_length=150, blank=True)
    profile_photo = models.ImageField(
        upload_to="users/profiles/%Y/%m/",
        blank=True,
        null=True,
        validators=[validate_image_upload],
    )
    bio = models.TextField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    is_presence_checker = models.BooleanField(
        default=False,
        help_text="Может отмечать посещаемость по QR (presence checker).",
    )
    is_verified_email = models.BooleanField(default=False)
    is_verified = models.BooleanField(
        default=False,
        help_text="Верифицированный участник (автоматически после 3 посещённых митапов).",
    )
    verified_at = models.DateTimeField(null=True, blank=True)
    cv_file = models.FileField(
        upload_to="users/cv/%Y/%m/",
        blank=True,
        null=True,
        validators=[validate_pdf_upload],
        help_text="Резюме / CV участника (PDF).",
    )
    is_company_user = models.BooleanField(
        default=False,
        help_text="Пользователь является представителем компании.",
    )

    age = models.PositiveIntegerField(blank=True, null=True, help_text="Возраст")
    city = models.CharField(max_length=255, blank=True, help_text="Город")

    EDUCATION_STUDENT = "student"
    EDUCATION_GRADUATE = "graduate"
    EDUCATION_NOT_STUDYING = "not_studying"
    EDUCATION_STATUS_CHOICES = [
        (EDUCATION_STUDENT, "Student"),
        (EDUCATION_GRADUATE, "Graduate"),
        (EDUCATION_NOT_STUDYING, "Not studying"),
    ]

    education_status = models.CharField(
        max_length=20,
        choices=EDUCATION_STATUS_CHOICES,
        blank=True,
        null=True,
        help_text="Статус обучения",
    )
    university = models.CharField(max_length=255, blank=True, null=True, help_text="Университет")

    class Meta:
        verbose_name = "User"
        verbose_name_plural = "Users"
        ordering = ("-created_at",)
        indexes = [
            models.Index(fields=["is_verified_email"]),
            models.Index(fields=["is_verified"]),
            models.Index(fields=["is_company_user"]),
        ]

    def __str__(self) -> str:
        return self.username or self.email or f"User #{self.pk}"

    def get_absolute_url(self) -> str:
        return reverse("users:user-detail", kwargs={"pk": self.pk})

    @property
    def display_name(self) -> str:
        full = f"{self.first_name} {self.last_name}".strip()
        return full or self.username or (self.email or f"User #{self.pk}")

    @property
    def initials(self) -> str:
        if self.first_name or self.last_name:
            parts = [p for p in (self.first_name[:1], self.last_name[:1]) if p]
            return "".join(parts).upper()
        if self.username:
            return self.username[:2].upper()
        if self.email:
            return self.email[:2].upper()
        return "UU"

    @property
    def avatar(self):
        return self.profile_photo

    def has_complete_profile(self) -> bool:
        if not (self.first_name and self.last_name and self.email):
            return False
        if self.age is None or not (self.city or "").strip() or not (self.phone or "").strip():
            return False
        if not self.education_status:
            return False
        if self.education_status in (self.EDUCATION_STUDENT, self.EDUCATION_GRADUATE):
            if not (self.university or "").strip():
                return False
        return True

    def record_login(self) -> None:
        self.last_login = timezone.now()
        self.save(update_fields=["last_login"])
