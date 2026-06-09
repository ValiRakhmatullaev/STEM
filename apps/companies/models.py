"""
Company system: Company, CompanyUser (M2M through), JobPosting.
"""
from __future__ import annotations

from django.conf import settings
from django.db import models
from django.urls import reverse

from apps.common.models import TimeStampedModel
from apps.skills.models import Skill


class Industry(models.TextChoices):
    FINTECH = "fintech", "Fintech"
    EDTECH = "edtech", "Edtech"
    TELECOM = "telecom", "Telecom"
    SOFTWARE = "software", "Software"
    OTHER = "other", "Other"


class CompanySize(models.TextChoices):
    STARTUP = "startup", "Startup"
    SMALL = "small", "Small"
    MEDIUM = "medium", "Medium"
    LARGE = "large", "Large"
    ENTERPRISE = "enterprise", "Enterprise"


class CompanyUserRole(models.TextChoices):
    ADMIN = "admin", "Admin"
    MANAGER = "manager", "Manager"
    RECRUITER = "recruiter", "Recruiter"


class ExperienceLevel(models.TextChoices):
    JUNIOR = "junior", "Junior"
    MIDDLE = "middle", "Middle"
    SENIOR = "senior", "Senior"
    LEAD = "lead", "Lead"


class EmploymentType(models.TextChoices):
    FULL_TIME = "full_time", "Full time"
    PART_TIME = "part_time", "Part time"
    CONTRACT = "contract", "Contract"
    INTERNSHIP = "internship", "Internship"


class LocationType(models.TextChoices):
    ON_SITE = "on_site", "On site"
    REMOTE = "remote", "Remote"
    HYBRID = "hybrid", "Hybrid"


class Company(TimeStampedModel):
    company_name = models.CharField(max_length=255)
    slug = models.SlugField(unique=True, max_length=255)
    logo = models.ImageField(
        upload_to="companies/logos/%Y/%m/",
        blank=True,
        null=True,
    )
    description = models.TextField(blank=True)
    description_ru = models.TextField("Description RU", blank=True)
    description_uz = models.TextField("Description UZ", blank=True)
    description_en = models.TextField("Description EN", blank=True)
    website = models.URLField(blank=True)
    industry = models.CharField(
        max_length=20,
        choices=Industry.choices,
        db_index=True,
    )
    size = models.CharField(
        max_length=20,
        choices=CompanySize.choices,
        db_index=True,
    )
    location = models.CharField(max_length=255)
    is_verified = models.BooleanField(default=False)
    verified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="verified_companies",
    )
    verified_at = models.DateTimeField(null=True, blank=True)
    is_approved_for_talents = models.BooleanField(
        default=False,
        help_text="Админ разрешил компании доступ к verified участникам.",
    )
    approved_for_talents_at = models.DateTimeField(null=True, blank=True)
    users = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        through="CompanyUser",
        related_name="companies",
        blank=True,
    )

    class Meta:
        verbose_name = "Company"
        verbose_name_plural = "Companies"
        ordering = ("-created_at",)
        indexes = [
            models.Index(fields=["is_verified"]),
            models.Index(fields=["industry"]),
        ]

    def __str__(self) -> str:
        return self.company_name

    def get_absolute_url(self) -> str:
        return reverse("companies:company-detail", kwargs={"slug": self.slug})


class CompanyUser(models.Model):
    """M2M through model: User <-> Company with role."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="company_memberships",
    )
    company = models.ForeignKey(
        Company,
        on_delete=models.CASCADE,
        related_name="members",
    )
    role = models.CharField(
        max_length=20,
        choices=CompanyUserRole.choices,
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Company user"
        verbose_name_plural = "Company users"
        ordering = ("company", "user")
        unique_together = [("user", "company")]

    def __str__(self) -> str:
        return f"{self.user_id} @ {self.company.company_name} ({self.role})"


class JobPosting(TimeStampedModel):
    company = models.ForeignKey(
        Company,
        on_delete=models.CASCADE,
        related_name="job_postings",
    )
    publish_as_company = models.BooleanField(
        default=False,
        help_text="Show the selected company as the public publisher. If disabled, the job is shown as posted by STEM Woman Uzbekistan.",
    )
    title = models.CharField(max_length=255, blank=True)
    title_ru = models.CharField("Title RU", max_length=255, blank=True)
    title_uz = models.CharField("Title UZ", max_length=255, blank=True)
    title_en = models.CharField("Title EN", max_length=255, blank=True)
    slug = models.SlugField(unique=True, max_length=255)
    description = models.TextField(blank=True)
    description_ru = models.TextField("Description RU", blank=True)
    description_uz = models.TextField("Description UZ", blank=True)
    description_en = models.TextField("Description EN", blank=True)
    requirements = models.TextField(blank=True)
    requirements_ru = models.TextField("Requirements RU", blank=True)
    requirements_uz = models.TextField("Requirements UZ", blank=True)
    requirements_en = models.TextField("Requirements EN", blank=True)
    skills_required = models.ManyToManyField(
        Skill,
        related_name="job_postings",
        blank=True,
    )
    experience_level = models.CharField(
        max_length=20,
        choices=ExperienceLevel.choices,
        db_index=True,
    )
    employment_type = models.CharField(
        max_length=20,
        choices=EmploymentType.choices,
        db_index=True,
    )
    location_type = models.CharField(
        max_length=20,
        choices=LocationType.choices,
        db_index=True,
    )
    salary_min = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
    )
    salary_max = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
    )
    apply_url = models.URLField(
        max_length=500,
        blank=True,
        help_text="External application URL on the employer website.",
    )
    is_active = models.BooleanField(default=True, db_index=True)
    published_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    views_count = models.PositiveIntegerField(default=0)
    applications_count = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name = "Job posting"
        verbose_name_plural = "Job postings"
        ordering = ("-published_at", "-created_at")
        indexes = [
            models.Index(fields=["is_active"]),
            models.Index(fields=["-published_at"]),
        ]

    def __str__(self) -> str:
        title = self.title_ru or self.title or self.title_uz or self.title_en or str(self.pk)
        return f"{title} @ {self.company.company_name}"

    def get_absolute_url(self) -> str:
        return reverse("companies:job-detail", kwargs={"slug": self.slug})

    def clean(self) -> None:
        from django.core.exceptions import ValidationError

        if self.salary_min is not None and self.salary_max is not None:
            if self.salary_min > self.salary_max:
                raise ValidationError(
                    {"salary_max": "Salary max must be greater than or equal to salary min."}
                )
        super().clean()
