"""
Mentorship system: MentorshipRequest, MentorshipSession.
"""
from __future__ import annotations

from django.conf import settings
from django.db import models

from apps.common.models import TimeStampedModel


class MentorshipRequestStatus(models.TextChoices):
    PENDING = "pending", "Pending"
    ACCEPTED = "accepted", "Accepted"
    REJECTED = "rejected", "Rejected"
    CANCELLED = "cancelled", "Cancelled"


class MentorshipSessionStatus(models.TextChoices):
    SCHEDULED = "scheduled", "Scheduled"
    COMPLETED = "completed", "Completed"
    CANCELLED = "cancelled", "Cancelled"
    NO_SHOW = "no_show", "No show"


class MentorshipRequest(TimeStampedModel):
    mentee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="mentorship_requests_sent",
    )
    mentor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="mentorship_requests_received",
    )
    message = models.TextField()
    goals = models.TextField(blank=True)
    status = models.CharField(
        max_length=20,
        choices=MentorshipRequestStatus.choices,
        default=MentorshipRequestStatus.PENDING,
        db_index=True,
    )
    responded_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = "Mentorship request"
        verbose_name_plural = "Mentorship requests"
        ordering = ("-created_at",)
        indexes = [models.Index(fields=["status"])]

    def __str__(self) -> str:
        return f"{self.mentee_id} → {self.mentor_id} ({self.status})"


class MentorshipSession(models.Model):
    request = models.ForeignKey(
        MentorshipRequest,
        on_delete=models.CASCADE,
        related_name="sessions",
    )
    date_time = models.DateTimeField(db_index=True)
    duration_minutes = models.PositiveIntegerField(default=60)
    meeting_link = models.URLField(blank=True)
    status = models.CharField(
        max_length=20,
        choices=MentorshipSessionStatus.choices,
        default=MentorshipSessionStatus.SCHEDULED,
        db_index=True,
    )
    notes = models.TextField(blank=True, null=True)
    mentee_feedback = models.TextField(blank=True, null=True)
    mentee_rating = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
        help_text="1-5",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Mentorship session"
        verbose_name_plural = "Mentorship sessions"
        ordering = ("date_time",)

    def __str__(self) -> str:
        return f"Session {self.request_id} @ {self.date_time} ({self.status})"

    def clean(self) -> None:
        from django.core.exceptions import ValidationError

        if self.mentee_rating is not None and (self.mentee_rating < 1 or self.mentee_rating > 5):
            raise ValidationError({"mentee_rating": "Must be between 1 and 5."})
        super().clean()
