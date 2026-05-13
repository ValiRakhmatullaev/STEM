import pytest
from django.contrib.auth import get_user_model
from django.test import Client

from config.settings import _is_weak_secret


def test_weak_secret_detector_blocks_placeholders():
    assert _is_weak_secret("change-me")
    assert _is_weak_secret("django-insecure-change-me-in-production")
    assert not _is_weak_secret("prod-" + "aB3!" * 20)


@pytest.mark.django_db
def test_security_headers_are_set():
    response = Client().get("/health/live/")
    assert response["X-Content-Type-Options"] == "nosniff"
    assert "default-src 'self'" in response["Content-Security-Policy"]
    assert "X-Request-ID" in response
    assert "Server-Timing" in response


@pytest.mark.django_db
def test_presence_checker_list_does_not_expose_cv_or_profile_photo():
    User = get_user_model()
    checker = User.objects.create_user(
        username="checker",
        email="checker@test.invalid",
        password="pw",
        is_presence_checker=True,
    )
    User.objects.create_user(
        username="participant",
        email="participant@test.invalid",
        password="pw",
        first_name="Ada",
        last_name="Lovelace",
    )

    client = Client()
    client.force_login(checker)
    response = client.get("/api/admin/users-for-presence-checker/")

    assert response.status_code == 200
    body = response.json()
    assert body["results"]
    assert "cv_file" not in body["results"][0]
    assert "profile_photo" not in body["results"][0]
