from __future__ import annotations

from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from apps.career_fairs.models import CareerFair
from apps.companies.models import JobPosting
from apps.events.models import Event

from .models import NewsItem
from .services import delete_auto_news, sync_auto_news


@receiver(post_save, sender=Event)
def sync_event_news(sender, instance: Event, **kwargs):
    sync_auto_news(
        source_type=NewsItem.SourceType.EVENT,
        source_id=instance.pk,
        is_published=instance.is_published,
        source_url=f"/events/{instance.pk}",
        title_ru=instance.title_ru or instance.title,
        title_uz=instance.title_uz,
        title_en=instance.title_en,
        summary_ru=instance.description_ru or instance.description,
        summary_uz=instance.description_uz,
        summary_en=instance.description_en,
        content_ru=instance.description_ru or instance.description,
        content_uz=instance.description_uz,
        content_en=instance.description_en,
        banner_image=instance.banner_image,
    )


@receiver(post_delete, sender=Event)
def delete_event_news(sender, instance: Event, **kwargs):
    delete_auto_news(source_type=NewsItem.SourceType.EVENT, source_id=instance.pk)


@receiver(post_save, sender=CareerFair)
def sync_opportunity_news(sender, instance: CareerFair, **kwargs):
    sync_auto_news(
        source_type=NewsItem.SourceType.OPPORTUNITY,
        source_id=instance.pk,
        is_published=instance.is_active,
        source_url=f"/career-fairs/{instance.pk}",
        title_ru=instance.title_ru or instance.title,
        title_uz=instance.title_uz,
        title_en=instance.title_en,
        summary_ru=instance.description_ru or instance.description,
        summary_uz=instance.description_uz,
        summary_en=instance.description_en,
        content_ru=instance.description_ru or instance.description,
        content_uz=instance.description_uz,
        content_en=instance.description_en,
        banner_image=instance.banner_image,
    )


@receiver(post_delete, sender=CareerFair)
def delete_opportunity_news(sender, instance: CareerFair, **kwargs):
    delete_auto_news(source_type=NewsItem.SourceType.OPPORTUNITY, source_id=instance.pk)


@receiver(post_save, sender=JobPosting)
def sync_job_news(sender, instance: JobPosting, **kwargs):
    sync_auto_news(
        source_type=NewsItem.SourceType.JOB,
        source_id=instance.pk,
        is_published=instance.is_active,
        source_url=f"/jobs/{instance.pk}",
        title_ru=instance.title_ru or instance.title,
        title_uz=instance.title_uz,
        title_en=instance.title_en,
        summary_ru=instance.description_ru or instance.description,
        summary_uz=instance.description_uz,
        summary_en=instance.description_en,
        content_ru=instance.description_ru or instance.description,
        content_uz=instance.description_uz,
        content_en=instance.description_en,
    )


@receiver(post_delete, sender=JobPosting)
def delete_job_news(sender, instance: JobPosting, **kwargs):
    delete_auto_news(source_type=NewsItem.SourceType.JOB, source_id=instance.pk)
