"""
Job applications: JobApplication (links JobPosting and User).
"""
from __future__ import annotations

from django.conf import settings
from django.db import models

from apps.common.models import TimeStampedModel
from apps.common.validators import validate_pdf_upload
from apps.companies.models import JobPosting


class ApplicationStatus(models.TextChoices):
    NEW = "new", "New"
    VIEWED = "viewed", "Viewed"
    SHORTLISTED = "shortlisted", "Shortlisted"
    REJECTED = "rejected", "Rejected"
    HIRED = "hired", "Hired"


class JobApplication(TimeStampedModel):
    job = models.ForeignKey(
        JobPosting,
        on_delete=models.CASCADE,
        related_name="applications",
    )
    applicant = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="job_applications",
    )
    cover_letter = models.TextField(blank=True)
    resume_url = models.FileField(
        upload_to="jobs/resumes/%Y/%m/",
        blank=True,
        null=True,
        validators=[validate_pdf_upload],
    )
    status = models.CharField(
        max_length=20,
        choices=ApplicationStatus.choices,
        default=ApplicationStatus.NEW,
        db_index=True,
    )
    applied_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Job application"
        verbose_name_plural = "Job applications"
        ordering = ("-applied_at",)
        unique_together = [("job", "applicant")]
        indexes = [models.Index(fields=["status"])]

    def __str__(self) -> str:
        return f"{self.applicant_id} → {self.job.title} ({self.status})"
