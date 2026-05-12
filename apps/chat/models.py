"""
Chat & Interview system:
  - ChatRoom: 1-to-1 conversation linked to a JobApplication
  - ChatMessage: individual messages within a room
  - InterviewInvite: interview scheduling tied to a ChatRoom/Application
"""
from __future__ import annotations

from django.conf import settings
from django.db import models

from apps.common.models import TimeStampedModel
from apps.jobs.models import JobApplication


class ChatRoom(TimeStampedModel):
    """One chat room per accepted job application (company ↔ candidate)."""
    application = models.OneToOneField(
        JobApplication,
        on_delete=models.CASCADE,
        related_name="chat_room",
    )
    company_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="company_chat_rooms",
        help_text="Company-side user who manages this chat.",
    )
    candidate = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="candidate_chat_rooms",
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Chat room"
        verbose_name_plural = "Chat rooms"
        ordering = ("-created_at",)

    def __str__(self) -> str:
        return f"Chat: {self.company_user_id} ↔ {self.candidate_id} (app #{self.application_id})"


class ChatMessage(models.Model):
    """A single message in a chat room."""
    room = models.ForeignKey(
        ChatRoom,
        on_delete=models.CASCADE,
        related_name="messages",
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="sent_chat_messages",
    )
    text = models.TextField()
    is_read = models.BooleanField(default=False, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        verbose_name = "Chat message"
        verbose_name_plural = "Chat messages"
        ordering = ("created_at",)

    def __str__(self) -> str:
        return f"Msg #{self.pk} by {self.sender_id} in room #{self.room_id}"


class InterviewFormat(models.TextChoices):
    ONLINE = "online", "Online (Zoom/Google Meet)"
    OFFLINE = "offline", "Offline (в офисе)"
    PHONE = "phone", "По телефону"


class InterviewStatus(models.TextChoices):
    PENDING = "pending", "Ожидает ответа"
    ACCEPTED = "accepted", "Подтверждено"
    DECLINED = "declined", "Отклонено"
    RESCHEDULED = "rescheduled", "Перенесено"
    COMPLETED = "completed", "Завершено"
    CANCELLED = "cancelled", "Отменено"


class InterviewInvite(TimeStampedModel):
    """Interview invitation sent by company to candidate."""
    room = models.ForeignKey(
        ChatRoom,
        on_delete=models.CASCADE,
        related_name="interviews",
    )
    scheduled_at = models.DateTimeField(
        help_text="Дата и время интервью.",
    )
    duration_minutes = models.PositiveIntegerField(
        default=30,
        help_text="Длительность в минутах.",
    )
    format = models.CharField(
        max_length=20,
        choices=InterviewFormat.choices,
        default=InterviewFormat.ONLINE,
    )
    location = models.CharField(
        max_length=500,
        blank=True,
        help_text="Zoom-ссылка или адрес офиса.",
    )
    note = models.TextField(
        blank=True,
        help_text="Дополнительная информация от компании.",
    )
    status = models.CharField(
        max_length=20,
        choices=InterviewStatus.choices,
        default=InterviewStatus.PENDING,
        db_index=True,
    )
    candidate_comment = models.TextField(
        blank=True,
        help_text="Комментарий кандидата (при переносе/отклонении).",
    )

    class Meta:
        verbose_name = "Interview invite"
        verbose_name_plural = "Interview invites"
        ordering = ("-scheduled_at",)

    def __str__(self) -> str:
        return f"Interview {self.pk} ({self.status}) — room #{self.room_id}"
