from __future__ import annotations

from django.db import models


class TimeStampedModel(models.Model):
    """
    Abstract base model that adds created/updated timestamps and default ordering.
    """

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True
        ordering = ("-created_at",)


class AuditEvent(TimeStampedModel):
    """
    Immutable application audit trail for security-sensitive actions and PII access.
    """

    actor = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="audit_events",
    )
    action = models.CharField(max_length=100, db_index=True)
    target_type = models.CharField(max_length=100, blank=True, db_index=True)
    target_id = models.CharField(max_length=100, blank=True)
    request_id = models.CharField(max_length=128, blank=True, db_index=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        verbose_name = "Audit event"
        verbose_name_plural = "Audit events"
        ordering = ("-created_at",)
        indexes = [
            models.Index(fields=["action", "-created_at"]),
            models.Index(fields=["target_type", "target_id"]),
            models.Index(fields=["actor", "-created_at"]),
        ]

    def save(self, *args, **kwargs):
        if self.pk:
            raise ValueError("Audit events are immutable.")
        return super().save(*args, **kwargs)

    def __str__(self) -> str:
        return f"{self.action} {self.target_type}:{self.target_id}"

