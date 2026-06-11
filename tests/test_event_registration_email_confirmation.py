from datetime import timedelta
from uuid import uuid4

import pytest
from django.contrib.auth import get_user_model
from django.core import mail
from django.test import Client, override_settings
from django.utils import timezone

from apps.events.models import Event, EventRegistration, EventType


def _create_event() -> Event:
    return Event.objects.create(
        title_ru="Email confirmation event",
        slug="email-confirmation-event",
        description_ru="Description",
        event_type=EventType.MEETUP,
        date=timezone.now().date() + timedelta(days=7),
        time="12:00",
        duration_minutes=60,
        location="British Management University",
        capacity=20,
        organizer_name="STEM Woman Uzbekistan",
        is_published=True,
    )


@pytest.mark.django_db
@override_settings(
    EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
    SITE_PUBLIC_BASE_URL="https://stemwoman.uz",
    DEFAULT_FROM_EMAIL="STEM Woman Uzbekistan <info@stemwoman.uz>",
)
def test_event_registration_sends_email_confirmation_link():
    User = get_user_model()
    user = User.objects.create_user(username="participant", email="participant@test.invalid", password="pw")
    event = _create_event()
    client = Client()
    client.force_login(user)

    response = client.post(f"/api/events/{event.pk}/register/")

    assert response.status_code == 201
    assert response.json()["confirmation_required"] is True
    assert response.json()["confirmation_email_sent"] is True
    registration = EventRegistration.objects.get(event=event, user=user)
    assert registration.organizer_confirmed is False
    assert registration.email_confirmed_at is None
    assert registration.confirmation_email_sent_at is not None
    assert len(mail.outbox) == 1
    assert mail.outbox[0].subject == "You’re In! Confirm Your Spot for “Email confirmation event” 🚀"
    assert "Hello, participant!" in mail.outbox[0].body
    assert "Date:" in mail.outbox[0].body
    assert "Time: 12:00 PM" in mail.outbox[0].body
    assert "Venue: British Management University" in mail.outbox[0].body
    assert f"/api/events/confirm-registration/{registration.email_confirmation_token}/" in mail.outbox[0].body


@pytest.mark.django_db
@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
def test_event_registration_confirmation_link_confirms_registration():
    User = get_user_model()
    user = User.objects.create_user(username="participant", email="participant@test.invalid", password="pw")
    event = _create_event()
    registration = EventRegistration.objects.create(event=event, user=user)

    response = Client().get(f"/api/events/confirm-registration/{registration.email_confirmation_token}/")

    assert response.status_code == 200
    registration.refresh_from_db()
    assert registration.organizer_confirmed is True
    assert registration.email_confirmed_at is not None


@pytest.mark.django_db
@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
def test_event_registration_confirmation_link_accepts_uuid_with_dashes_for_hex_token():
    User = get_user_model()
    user = User.objects.create_user(username="participant", email="participant@test.invalid", password="pw")
    event = _create_event()
    token = uuid4()
    registration = EventRegistration.objects.create(
        event=event,
        user=user,
        email_confirmation_token=token.hex,
    )

    response = Client().get(f"/api/events/confirm-registration/{token}/")

    assert response.status_code == 200
    registration.refresh_from_db()
    assert registration.organizer_confirmed is True
    assert registration.email_confirmed_at is not None


@pytest.mark.django_db
@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
def test_reposting_unconfirmed_registration_resends_confirmation_email():
    User = get_user_model()
    user = User.objects.create_user(username="participant", email="participant@test.invalid", password="pw")
    event = _create_event()
    EventRegistration.objects.create(event=event, user=user, organizer_confirmed=False)
    client = Client()
    client.force_login(user)

    response = client.post(f"/api/events/{event.pk}/register/")

    assert response.status_code == 200
    assert response.json()["confirmation_required"] is True
    assert response.json()["confirmation_email_sent"] is True
    assert len(mail.outbox) == 1
