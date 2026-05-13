"""
Events system: Event, EventRegistration.
"""
from __future__ import annotations

import uuid

from django.conf import settings
from django.db import models
from django.urls import reverse

from apps.common.models import TimeStampedModel


class EventType(models.TextChoices):
    MEETUP = "meetup", "Meetup"
    WORKSHOP = "workshop", "Workshop"
    CAREER_FAIR = "career_fair", "Career fair"
    NETWORKING = "networking", "Networking"
    WEBINAR = "webinar", "Webinar"


class RegistrationStatus(models.TextChoices):
    REGISTERED = "registered", "Registered"
    CANCELLED = "cancelled", "Cancelled"
    ATTENDED = "attended", "Attended"
    NO_SHOW = "no_show", "No show"


class Event(TimeStampedModel):
    title = models.CharField(max_length=255)
    slug = models.SlugField(unique=True, max_length=255)
    description = models.TextField()
    event_type = models.CharField(
        max_length=20,
        choices=EventType.choices,
        db_index=True,
    )
    banner_image = models.ImageField(
        upload_to="events/banners/%Y/%m/",
        blank=True,
        null=True,
    )
    date = models.DateField(db_index=True)
    time = models.TimeField()
    duration_minutes = models.PositiveIntegerField()
    location = models.TextField(blank=True, null=True)
    is_online = models.BooleanField(default=False)
    meeting_link = models.URLField(blank=True, null=True)
    capacity = models.PositiveIntegerField()
    registered_count = models.PositiveIntegerField(default=0)
    waitlist_count = models.PositiveIntegerField(default=0)
    organizer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="organized_events",
    )
    is_published = models.BooleanField(default=False, db_index=True)

    class Meta:
        verbose_name = "Event"
        verbose_name_plural = "Events"
        ordering = ("date", "time")
        indexes = [
            models.Index(fields=["date"]),
            models.Index(fields=["is_published"]),
        ]

    def __str__(self) -> str:
        return self.title

    def get_absolute_url(self) -> str:
        return reverse("events:event-detail", kwargs={"slug": self.slug})

    def clean(self) -> None:
        from django.core.exceptions import ValidationError
        from django.utils import timezone

        if self.date and self.time:
            now = timezone.now()
            if self.date < now.date():
                raise ValidationError({"date": "Event date must be today or in the future."})
            if self.date == now.date() and self.time <= now.time():
                raise ValidationError({"time": "Event time must be in the future when date is today."})
        super().clean()


class EventRegistration(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="event_registrations",
    )
    event = models.ForeignKey(
        Event,
        on_delete=models.CASCADE,
        related_name="registrations",
    )
    status = models.CharField(
        max_length=20,
        choices=RegistrationStatus.choices,
        default=RegistrationStatus.REGISTERED,
    )
    is_waitlist = models.BooleanField(default=False)
    organizer_confirmed = models.BooleanField(
        default=False,
        verbose_name="Подтверждено организатором",
        help_text="Организатор или администратор подтвердил участие.",
    )
    qr_token = models.CharField(
        max_length=64,
        unique=True,
        default=uuid.uuid4,
        editable=False,
        help_text="Уникальный токен для QR-кода (используется только для отметки посещаемости).",
    )
    visits_count = models.PositiveIntegerField(default=0)
    last_visit_at = models.DateTimeField(null=True, blank=True)
    registered_at = models.DateTimeField(auto_now_add=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)
    checked_in = models.BooleanField(default=False)
    checked_in_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = "Event registration"
        verbose_name_plural = "Event registrations"
        ordering = ("-registered_at",)
        unique_together = [("user", "event")]
        indexes = [
            models.Index(fields=["user", "checked_in"], name="evreg_user_checked_in_idx"),
            models.Index(fields=["event", "status", "is_waitlist"]),
            models.Index(fields=["user", "status"]),
            models.Index(fields=["checked_in", "checked_in_at"]),
        ]

    def __str__(self) -> str:
        return f"{self.user_id} — {self.event.title} ({self.status})"
