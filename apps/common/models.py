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

