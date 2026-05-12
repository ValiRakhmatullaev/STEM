"""
Career fair module: CareerFair, CareerFairCompany, CareerFairRegistration.
"""
from __future__ import annotations

from django.conf import settings
from django.db import models
from django.urls import reverse

from apps.common.models import TimeStampedModel
from apps.companies.models import Company


class CareerFair(TimeStampedModel):
    title = models.CharField(max_length=255)
    slug = models.SlugField(unique=True, max_length=255)
    description = models.TextField(blank=True)
    date_start = models.DateField(db_index=True)
    date_end = models.DateField(db_index=True)
    location = models.CharField(max_length=255)
    banner_image = models.ImageField(
        upload_to="career_fairs/banners/%Y/%m/",
        blank=True,
        null=True,
    )
    is_active = models.BooleanField(default=True, db_index=True)
    max_companies = models.PositiveIntegerField()
    registered_companies_count = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name = "Career fair"
        verbose_name_plural = "Career fairs"
        ordering = ("-date_start",)
        indexes = [models.Index(fields=["is_active"])]

    def __str__(self) -> str:
        return self.title

    def get_absolute_url(self) -> str:
        return reverse("career_fairs:career-fair-detail", kwargs={"slug": self.slug})

    def clean(self) -> None:
        from django.core.exceptions import ValidationError

        if self.date_start and self.date_end and self.date_start > self.date_end:
            raise ValidationError({"date_end": "End date must be on or after start date."})
        super().clean()


class CareerFairCompany(models.Model):
    career_fair = models.ForeignKey(
        CareerFair,
        on_delete=models.CASCADE,
        related_name="companies",
    )
    company = models.ForeignKey(
        Company,
        on_delete=models.CASCADE,
        related_name="career_fair_participations",
    )
    booth_number = models.CharField(max_length=50, blank=True, null=True)
    is_premium = models.BooleanField(default=False)
    registered_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Career fair company"
        verbose_name_plural = "Career fair companies"
        ordering = ("career_fair", "booth_number")
        unique_together = [("career_fair", "company")]

    def __str__(self) -> str:
        return f"{self.company.company_name} @ {self.career_fair.title}"


class CareerFairRegistrationStatus(models.TextChoices):
    REGISTERED = "registered", "Registered"
    CANCELLED = "cancelled", "Cancelled"
    ATTENDED = "attended", "Attended"


class CareerFairRegistration(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="career_fair_registrations",
    )
    career_fair = models.ForeignKey(
        CareerFair,
        on_delete=models.CASCADE,
        related_name="registrations",
    )
    status = models.CharField(
        max_length=20,
        choices=CareerFairRegistrationStatus.choices,
        default=CareerFairRegistrationStatus.REGISTERED,
    )
    registered_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Career fair registration"
        verbose_name_plural = "Career fair registrations"
        ordering = ("-registered_at",)
        unique_together = [("user", "career_fair")]

    def __str__(self) -> str:
        return f"{self.user_id} — {self.career_fair.title} ({self.status})"
