"""
API: список и детали карьерных ярмарок для фронта.
"""
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.views.decorators.http import require_GET

from apps.common.utils import paginate_queryset
from .models import CareerFair


@require_GET
def career_fair_detail(request, pk):
    """
    GET /api/career-fairs/<id>/
    Одна карьерная ярмарка по id.
    """
    fair = get_object_or_404(CareerFair.objects.filter(is_active=True), pk=pk)
    data = {
        "id": fair.pk,
        "title": fair.title,
        "slug": fair.slug,
        "description": fair.description or "",
        "date_start": fair.date_start.isoformat(),
        "date_end": fair.date_end.isoformat(),
        "location": fair.location,
        "banner_image": fair.banner_image.url if fair.banner_image else None,
        "registered_companies_count": fair.registered_companies_count,
        "max_companies": fair.max_companies,
    }
    return JsonResponse(data)


@require_GET
def career_fair_list(request):
    """
    GET /api/career-fairs/
    Список активных карьерных ярмарок из БД.
    """
    fairs = CareerFair.objects.filter(is_active=True).order_by("-date_start")
    page_items, meta = paginate_queryset(request, fairs, per_page=50)
    data = [
        {
            "id": f.pk,
            "title": f.title,
            "slug": f.slug,
            "description": (f.description or "")[:300],
            "date_start": f.date_start.isoformat(),
            "date_end": f.date_end.isoformat(),
            "location": f.location,
            "registered_companies_count": f.registered_companies_count,
            "max_companies": f.max_companies,
        }
        for f in page_items
    ]
    return JsonResponse({"results": data, "pagination": meta})
