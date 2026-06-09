from __future__ import annotations

from django.db import transaction
from django.utils import timezone
from django.utils.text import slugify

from .models import NewsItem


def _first_text(*values: str | None) -> str:
    for value in values:
        if value:
            return value
    return ""


def _shorten(value: str, limit: int = 300) -> str:
    text = (value or "").strip()
    if len(text) <= limit:
        return text
    return text[: limit - 1].rstrip() + "..."


def _unique_news_slug(source_type: str, source_id: int, title: str) -> str:
    base_title = slugify(title)[:180] or source_type
    base_slug = f"{source_type}-{source_id}-{base_title}"[:240].strip("-")
    slug = base_slug
    counter = 1
    while NewsItem.objects.filter(slug=slug).exists():
        suffix = f"-{counter}"
        slug = f"{base_slug[: 255 - len(suffix)]}{suffix}"
        counter += 1
    return slug


def sync_auto_news(
    *,
    source_type: str,
    source_id: int,
    is_published: bool,
    source_url: str,
    title_ru: str = "",
    title_uz: str = "",
    title_en: str = "",
    summary_ru: str = "",
    summary_uz: str = "",
    summary_en: str = "",
    content_ru: str = "",
    content_uz: str = "",
    content_en: str = "",
    banner_image=None,
) -> None:
    if not source_id:
        return

    if not is_published:
        NewsItem.objects.filter(source_type=source_type, source_id=source_id).update(
            is_published=False,
        )
        return

    fallback_title = _first_text(title_ru, title_uz, title_en, f"{source_type} {source_id}")
    defaults = {
        "title": fallback_title,
        "title_ru": title_ru,
        "title_uz": title_uz,
        "title_en": title_en,
        "summary": _shorten(_first_text(summary_ru, summary_uz, summary_en, content_ru, content_uz, content_en)),
        "summary_ru": _shorten(summary_ru or content_ru),
        "summary_uz": _shorten(summary_uz or content_uz),
        "summary_en": _shorten(summary_en or content_en),
        "content": _first_text(content_ru, content_uz, content_en),
        "content_ru": content_ru,
        "content_uz": content_uz,
        "content_en": content_en,
        "source_url": source_url,
        "is_published": True,
        "published_at": timezone.now(),
    }
    if banner_image:
        defaults["banner_image"] = banner_image

    with transaction.atomic():
        news = NewsItem.objects.filter(source_type=source_type, source_id=source_id).first()
        if news is None:
            NewsItem.objects.create(
                source_type=source_type,
                source_id=source_id,
                slug=_unique_news_slug(source_type, source_id, fallback_title),
                **defaults,
            )
            return

        for field, value in defaults.items():
            setattr(news, field, value)
        news.save()


def delete_auto_news(*, source_type: str, source_id: int) -> None:
    NewsItem.objects.filter(source_type=source_type, source_id=source_id).delete()
