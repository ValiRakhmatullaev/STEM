import json

import pytest
from django.contrib.auth import get_user_model
from django.test import Client


def _payload(**overrides):
    payload = {
        "username": "newuser",
        "email": "newuser@test.invalid",
        "password": "strong-password-123",
        "first_name": "Ada",
        "last_name": "Lovelace",
        "age": 25,
        "city": "Tashkent",
        "phone": "+998901234567",
        "education_status": "not_studying",
        "personal_data_consent": True,
    }
    payload.update(overrides)
    return payload


@pytest.mark.django_db
def test_registration_requires_personal_data_consent():
    response = Client().post(
        "/api/auth/register/",
        data=json.dumps(_payload(personal_data_consent=False)),
        content_type="application/json",
    )

    assert response.status_code == 400
    body = response.json()
    assert "personal_data_consent" in body["field_errors"]
    assert not get_user_model().objects.filter(username="newuser").exists()


@pytest.mark.django_db
def test_registration_records_personal_data_consent_metadata():
    response = Client(REMOTE_ADDR="203.0.113.10").post(
        "/api/auth/register/",
        data=json.dumps(_payload()),
        content_type="application/json",
    )

    assert response.status_code == 201
    user = get_user_model().objects.get(username="newuser")
    assert user.personal_data_consent is True
    assert user.personal_data_consent_at is not None
    assert user.personal_data_consent_version == "personal-data-v1"
    assert user.personal_data_consent_ip == "203.0.113.10"
