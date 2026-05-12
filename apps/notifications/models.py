"""
Notification system: generic Notification with ContentType link.
"""
from __future__ import annotations

from django.conf import settings
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.db import models


class NotificationType(models.TextChoices):
    EVENT = "event", "Event"
    MENTORSHIP = "mentorship", "Mentorship"
    COMPANY = "company", "Company"
    SYSTEM = "system", "System"
    JOB = "job", "Job"
    CAREER_FAIR = "career_fair", "Career fair"


class Notification(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications",
    )
    title = models.CharField(max_length=255)
    message = models.TextField()
    type = models.CharField(
        max_length=20,
        choices=NotificationType.choices,
        db_index=True,
    )
    link = models.CharField(max_length=500, blank=True, help_text="URL for frontend (e.g. /events/1)")
    content_type = models.ForeignKey(
        ContentType,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
    )
    object_id = models.PositiveIntegerField(null=True, blank=True)
    content_object = GenericForeignKey("content_type", "object_id")
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Notification"
        verbose_name_plural = "Notifications"
        ordering = ("-created_at",)
        indexes = [
            models.Index(fields=["user"]),
            models.Index(fields=["is_read"]),
            models.Index(fields=["type"]),
        ]

    def __str__(self) -> str:
        return f"{self.title} — {self.user_id}"
