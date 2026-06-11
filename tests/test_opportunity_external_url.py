from datetime import timedelta

import pytest
from django.test import Client
from django.utils import timezone

from apps.career_fairs.models import CareerFair


@pytest.mark.django_db
def test_opportunity_external_url_is_exposed_in_list_and_detail_api():
    external_url = "https://employer.example/opportunity"
    opportunity = CareerFair.objects.create(
        title_ru="External opportunity",
        slug="external-opportunity",
        description_ru="Description",
        date_start=timezone.now().date() + timedelta(days=3),
        date_end=timezone.now().date() + timedelta(days=4),
        location="Tashkent",
        external_url=external_url,
        is_active=True,
        max_companies=20,
    )
    client = Client()

    list_response = client.get("/api/career-fairs/")
    detail_response = client.get(f"/api/career-fairs/{opportunity.pk}/")

    assert list_response.status_code == 200
    assert list_response.json()["results"][0]["external_url"] == external_url
    assert detail_response.status_code == 200
    assert detail_response.json()["external_url"] == external_url
