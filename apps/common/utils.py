"""
Shared utilities for all apps.
"""
from django.core.paginator import Paginator, EmptyPage
from django.http import HttpRequest


def paginate_queryset(request: HttpRequest, queryset, per_page: int = 50):
    """
    Helper for function-based views that returns a (page_items, meta) tuple.
    Query params:
        page (int)  — 1-indexed page number, default 1
        per_page (int) — items per page (capped at 200)
    Returns:
        items  — list-like of objects for the current page
        meta   — dict with pagination info for the JSON response
    """
    try:
        per_page = min(int(request.GET.get("per_page", per_page)), 200)
    except (ValueError, TypeError):
        pass

    paginator = Paginator(queryset, per_page)

    try:
        page_number = int(request.GET.get("page", 1))
    except (ValueError, TypeError):
        page_number = 1

    try:
        page = paginator.page(page_number)
    except EmptyPage:
        page = paginator.page(paginator.num_pages)

    meta = {
        "page": page.number,
        "per_page": per_page,
        "total": paginator.count,
        "total_pages": paginator.num_pages,
        "has_next": page.has_next(),
        "has_previous": page.has_previous(),
    }
    return page.object_list, meta
