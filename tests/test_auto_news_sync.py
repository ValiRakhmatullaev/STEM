from datetime import timedelta

import pytest
from django.contrib.auth import get_user_model
from django.utils import timezone

from apps.career_fairs.models import CareerFair
from apps.companies.models import Company, CompanySize, Industry, JobPosting
from apps.content.models import NewsItem
from apps.events.models import Event, EventType


@pytest.mark.django_db
def test_published_event_creates_news_item():
    User = get_user_model()
    organizer = User.objects.create_user(username="event-org", email="event-org@test.invalid", password="pw")

    event = Event.objects.create(
        title_ru="RU event news",
        title_uz="UZ event news",
        title_en="EN event news",
        slug="event-news",
        description_ru="RU event description",
        description_uz="UZ event description",
        description_en="EN event description",
        event_type=EventType.MEETUP,
        date=timezone.now().date() + timedelta(days=10),
        time="10:00",
        duration_minutes=60,
        capacity=50,
        organizer=organizer,
        is_published=True,
    )

    news = NewsItem.objects.get(source_type=NewsItem.SourceType.EVENT, source_id=event.pk)
    assert news.is_published is True
    assert news.title_ru == "RU event news"
    assert news.title_uz == "UZ event news"
    assert news.title_en == "EN event news"
    assert news.source_url == f"/events/{event.pk}"

    event.is_published = False
    event.save(update_fields=["is_published"])
    news.refresh_from_db()
    assert news.is_published is False


@pytest.mark.django_db
def test_active_opportunity_creates_news_item():
    opportunity = CareerFair.objects.create(
        title_ru="RU opportunity",
        title_uz="UZ opportunity",
        title_en="EN opportunity",
        slug="opportunity-news",
        description_ru="RU opportunity description",
        description_uz="UZ opportunity description",
        description_en="EN opportunity description",
        date_start=timezone.now().date() + timedelta(days=3),
        date_end=timezone.now().date() + timedelta(days=4),
        location="Tashkent",
        is_active=True,
        max_companies=20,
    )

    news = NewsItem.objects.get(source_type=NewsItem.SourceType.OPPORTUNITY, source_id=opportunity.pk)
    assert news.is_published is True
    assert news.title_ru == "RU opportunity"
    assert news.content_uz == "UZ opportunity description"
    assert news.source_url == f"/career-fairs/{opportunity.pk}"


@pytest.mark.django_db
def test_active_job_creates_news_item():
    company = Company.objects.create(
        company_name="News Employer",
        slug="news-employer",
        industry=Industry.SOFTWARE,
        size=CompanySize.SMALL,
        location="Tashkent",
    )
    job = JobPosting.objects.create(
        company=company,
        publish_as_company=True,
        title_ru="RU job",
        title_uz="UZ job",
        title_en="EN job",
        slug="job-news",
        description_ru="RU job description",
        description_uz="UZ job description",
        description_en="EN job description",
        requirements_ru="RU job requirements",
        experience_level="junior",
        employment_type="full_time",
        location_type="remote",
        is_active=True,
        published_at=timezone.now(),
    )

    news = NewsItem.objects.get(source_type=NewsItem.SourceType.JOB, source_id=job.pk)
    assert news.is_published is True
    assert news.title_ru == "RU job"
    assert news.summary_en == "EN job description"
    assert news.source_url == f"/jobs/{job.pk}"
