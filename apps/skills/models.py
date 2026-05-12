"""
Skills system: Skill and UserSkill.
"""
from __future__ import annotations

from django.conf import settings
from django.db import models
from django.urls import reverse


class SkillCategory(models.TextChoices):
    PROGRAMMING = "programming", "Programming"
    DESIGN = "design", "Design"
    MANAGEMENT = "management", "Management"
    DATA = "data", "Data"
    SOFT_SKILL = "soft_skill", "Soft skill"
    LANGUAGE = "language", "Language"
    OTHER = "other", "Other"


class SkillLevel(models.TextChoices):
    BEGINNER = "beginner", "Beginner"
    INTERMEDIATE = "intermediate", "Intermediate"
    ADVANCED = "advanced", "Advanced"
    EXPERT = "expert", "Expert"


class Skill(models.Model):
    name = models.CharField(max_length=100, unique=True)
    category = models.CharField(
        max_length=20,
        choices=SkillCategory.choices,
        db_index=True,
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Skill"
        verbose_name_plural = "Skills"
        ordering = ("category", "name")
        indexes = [models.Index(fields=["is_active"])]

    def __str__(self) -> str:
        return self.name

    def get_absolute_url(self) -> str:
        return reverse("skills:skill-detail", kwargs={"pk": self.pk})


class UserSkill(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="user_skills",
    )
    skill = models.ForeignKey(
        Skill,
        on_delete=models.CASCADE,
        related_name="user_skills",
    )
    level = models.CharField(
        max_length=20,
        choices=SkillLevel.choices,
    )
    years_of_experience = models.PositiveIntegerField(null=True, blank=True)

    class Meta:
        verbose_name = "User skill"
        verbose_name_plural = "User skills"
        ordering = ("user", "skill")
        unique_together = [("user", "skill")]

    def __str__(self) -> str:
        return f"{self.user_id} — {self.skill.name} ({self.level})"
