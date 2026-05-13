from datetime import timedelta

import pytest
from django.contrib.auth import get_user_model
from django.utils import timezone

from apps.events.models import Event, EventRegistration, EventType
from apps.events.services import check_in_registration, register_user_for_event


@pytest.mark.django_db
def test_register_user_for_event_enforces_capacity_with_waitlist():
    User = get_user_model()
    organizer = User.objects.create_user(username="org", email="org-event@test.invalid", password="pw")
    user1 = User.objects.create_user(username="u1", email="u1-event@test.invalid", password="pw")
    user2 = User.objects.create_user(username="u2", email="u2-event@test.invalid", password="pw")
    event = Event.objects.create(
        title="Workshop",
        slug="workshop",
        description="d",
        event_type=EventType.WORKSHOP,
        date=timezone.now().date(),
        time=(timezone.now() + timedelta(hours=1)).time(),
        duration_minutes=60,
        capacity=1,
        organizer=organizer,
        is_published=True,
    )

    first = register_user_for_event(event_id=event.pk, user=user1)
    second = register_user_for_event(event_id=event.pk, user=user2)

    event.refresh_from_db()
    assert first.is_waitlist is False
    assert second.is_waitlist is True
    assert event.registered_count == 1
    assert event.waitlist_count == 1


@pytest.mark.django_db
def test_check_in_registration_is_idempotent():
    User = get_user_model()
    organizer = User.objects.create_user(username="org2", email="org2-event@test.invalid", password="pw")
    checker = User.objects.create_user(
        username="checker2",
        email="checker2-event@test.invalid",
        password="pw",
        is_presence_checker=True,
    )
    participant = User.objects.create_user(username="participant2", email="participant2-event@test.invalid", password="pw")
    event = Event.objects.create(
        title="Meetup",
        slug="meetup",
        description="d",
        event_type=EventType.MEETUP,
        date=timezone.now().date(),
        time=(timezone.now() + timedelta(hours=1)).time(),
        duration_minutes=60,
        capacity=10,
        organizer=organizer,
        is_published=True,
    )
    registration = EventRegistration.objects.create(event=event, user=participant)

    checked, changed = check_in_registration(registration_id=registration.pk, checker_user=checker)
    checked_again, changed_again = check_in_registration(registration_id=registration.pk, checker_user=checker)

    assert changed is True
    assert changed_again is False
    assert checked.visits_count == 1
    assert checked_again.visits_count == 1
