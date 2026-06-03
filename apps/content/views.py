from django.db.models import Q
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.views.decorators.http import require_GET

from apps.common.utils import paginate_queryset
from .models import HomeBanner, NewsItem


def _news_payload(news):
    title = news.title_ru or news.title or news.title_uz or news.title_en or ""
    summary = news.summary_ru or news.summary or news.summary_uz or news.summary_en or ""
    content = news.content_ru or news.content or news.content_uz or news.content_en or ""
    return {
        "id": news.pk,
        "title": title,
        "title_ru": news.title_ru or news.title or "",
        "title_uz": news.title_uz or "",
        "title_en": news.title_en or "",
        "slug": news.slug,
        "summary": summary,
        "summary_ru": news.summary_ru or news.summary or "",
        "summary_uz": news.summary_uz or "",
        "summary_en": news.summary_en or "",
        "content": content,
        "content_ru": news.content_ru or news.content or "",
        "content_uz": news.content_uz or "",
        "content_en": news.content_en or "",
        "banner_image": news.banner_image.url if news.banner_image else None,
        "published_at": news.published_at.isoformat() if news.published_at else None,
    }


@require_GET
def news_list(request):
    """
    GET /api/home/news/
    Список опубликованных новостей (для страницы /news).
    """
    news_qs = (
        NewsItem.objects.filter(is_published=True)
        .order_by("-published_at", "-created_at")
    )
    page_items, meta = paginate_queryset(request, news_qs, per_page=50)
    results = [_news_payload(n) for n in page_items]
    return JsonResponse({"results": results, "pagination": meta})


@require_GET
def news_detail(request, pk):
    """
    GET /api/home/news/<id>/
    Одна опубликованная новость по id (полный текст).
    """
    news = get_object_or_404(NewsItem.objects.filter(is_published=True), pk=pk)
    data = _news_payload(news)
    return JsonResponse(data)


@require_GET
def home_content(request):
    """
    GET /api/home/
    Данные для главной страницы: активный баннер + последние новости.
    """
    today = timezone.now().date()
    banner = (
        HomeBanner.objects.filter(is_active=True)
        .filter(
            Q(starts_at__isnull=True) | Q(starts_at__lte=today),
            Q(ends_at__isnull=True) | Q(ends_at__gte=today),
        )
        .order_by("priority", "-created_at")
        .first()
    )
    banner_data = None
    if banner:
        banner_data = {
            "title": banner.title,
            "subtitle": banner.subtitle,
            "button_label": banner.button_label,
            "button_url": banner.button_url,
            "image": banner.image.url if banner.image else None,
        }

    news_qs = (
        NewsItem.objects.filter(is_published=True)
        .order_by("-published_at", "-created_at")[:10]
    )
    news = [_news_payload(n) for n in news_qs]
    return JsonResponse({"banner": banner_data, "news": news})

