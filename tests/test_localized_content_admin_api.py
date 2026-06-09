from datetime import timedelta

import pytest
from django.contrib.auth import get_user_model
from django.utils import timezone

from apps.content.models import HomeBanner
from apps.events.models import Event, EventRegistration, EventType
from apps.companies.models import Company, CompanySize, Industry


@pytest.mark.django_db
def test_event_api_exposes_all_language_fields():
    User = get_user_model()
    organizer = User.objects.create_user(username="org", email="org-events@test.invalid", password="pw")
    event = Event.objects.create(
        title_ru="RU event",
        title_uz="UZ event",
        title_en="EN event",
        slug="localized-event",
        description_ru="RU description",
        description_uz="UZ description",
        description_en="EN description",
        event_type=EventType.WORKSHOP,
        date=timezone.now().date() + timedelta(days=5),
        time="10:00",
        duration_minutes=60,
        capacity=50,
        organizer=organizer,
        is_published=True,
    )

    from django.test import Client

    client = Client()
    list_response = client.get("/api/events/")
    assert list_response.status_code == 200
    list_item = list_response.json()["results"][0]
    assert list_item["title_ru"] == "RU event"
    assert list_item["title_uz"] == "UZ event"
    assert list_item["title_en"] == "EN event"
    assert list_item["description_uz"] == "UZ description"

    detail_response = client.get(f"/api/events/{event.pk}/")
    assert detail_response.status_code == 200
    detail = detail_response.json()
    assert detail["title_ru"] == "RU event"
    assert detail["description_en"] == "EN description"


@pytest.mark.django_db
def test_my_events_api_exposes_all_language_fields():
    User = get_user_model()
    organizer = User.objects.create_user(username="org", email="org-myevents@test.invalid", password="pw")
    participant = User.objects.create_user(username="participant", email="participant@test.invalid", password="pw")
    event = Event.objects.create(
        title_ru="RU ticket",
        title_uz="UZ ticket",
        title_en="EN ticket",
        slug="localized-ticket",
        description_ru="RU ticket description",
        event_type=EventType.MEETUP,
        date=timezone.now().date() + timedelta(days=5),
        time="11:00",
        duration_minutes=45,
        capacity=30,
        organizer=organizer,
        is_published=True,
    )
    EventRegistration.objects.create(user=participant, event=event, organizer_confirmed=True)

    from django.test import Client

    client = Client()
    client.force_login(participant)
    response = client.get("/api/events/my-registrations/")
    assert response.status_code == 200
    item = response.json()["results"][0]
    assert item["title_ru"] == "RU ticket"
    assert item["title_uz"] == "UZ ticket"
    assert item["title_en"] == "EN ticket"


@pytest.mark.django_db
def test_home_banner_api_exposes_all_language_fields():
    HomeBanner.objects.create(
        title_ru="RU banner",
        title_uz="UZ banner",
        title_en="EN banner",
        subtitle_ru="RU subtitle",
        subtitle_uz="UZ subtitle",
        subtitle_en="EN subtitle",
        button_label_ru="RU button",
        button_label_uz="UZ button",
        button_label_en="EN button",
        button_url="/register",
        is_active=True,
        priority=1,
    )

    from django.test import Client

    response = Client().get("/api/home/")
    assert response.status_code == 200
    banner = response.json()["banner"]
    assert banner["title_ru"] == "RU banner"
    assert banner["title_uz"] == "UZ banner"
    assert banner["title_en"] == "EN banner"
    assert banner["subtitle_uz"] == "UZ subtitle"
    assert banner["button_label_en"] == "EN button"


@pytest.mark.django_db
def test_company_api_exposes_all_language_fields():
    company = Company.objects.create(
        company_name="Localized Company",
        slug="localized-company",
        description_ru="RU company description",
        description_uz="UZ company description",
        description_en="EN company description",
        industry=Industry.SOFTWARE,
        size=CompanySize.SMALL,
        location="Tashkent",
    )

    from django.test import Client

    client = Client()
    list_response = client.get("/api/companies/")
    assert list_response.status_code == 200
    list_item = list_response.json()["results"][0]
    assert list_item["description_ru"] == "RU company description"
    assert list_item["description_uz"] == "UZ company description"
    assert list_item["description_en"] == "EN company description"

    detail_response = client.get(f"/api/companies/{company.pk}/")
    assert detail_response.status_code == 200
    detail = detail_response.json()
    assert detail["description_ru"] == "RU company description"
    assert detail["description_uz"] == "UZ company description"
    assert detail["description_en"] == "EN company description"
