from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.views.decorators.http import require_GET

from apps.common.utils import paginate_queryset

from .models import CareerFair


def _career_fair_payload(fair: CareerFair) -> dict:
    description = fair.description_ru or fair.description or fair.description_uz or fair.description_en or ""
    return {
        "id": fair.pk,
        "title": fair.title_ru or fair.title or fair.title_uz or fair.title_en,
        "title_ru": fair.title_ru or "",
        "title_uz": fair.title_uz or "",
        "title_en": fair.title_en or "",
        "slug": fair.slug,
        "description": description,
        "description_ru": fair.description_ru or "",
        "description_uz": fair.description_uz or "",
        "description_en": fair.description_en or "",
        "date_start": fair.date_start.isoformat(),
        "date_end": fair.date_end.isoformat(),
        "location": fair.location,
        "banner_image": fair.banner_image.url if fair.banner_image else None,
        "registered_companies_count": fair.registered_companies_count,
        "max_companies": fair.max_companies,
    }


@require_GET
def career_fair_detail(request, pk):
    fair = get_object_or_404(CareerFair.objects.filter(is_active=True), pk=pk)
    return JsonResponse(_career_fair_payload(fair))


@require_GET
def career_fair_list(request):
    fairs = CareerFair.objects.filter(is_active=True).order_by("-date_start")
    page_items, meta = paginate_queryset(request, fairs, per_page=50)
    data = []
    for fair in page_items:
        payload = _career_fair_payload(fair)
        payload["description"] = payload["description"][:300]
        payload["description_ru"] = payload["description_ru"][:300]
        payload["description_uz"] = payload["description_uz"][:300]
        payload["description_en"] = payload["description_en"][:300]
        data.append(payload)
    return JsonResponse({"results": data, "pagination": meta})
