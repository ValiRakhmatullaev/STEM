import pytest
from django.contrib.auth import get_user_model
from django.db import connection
from django.test import Client
from django.test.utils import CaptureQueriesContext


@pytest.mark.django_db
def test_health_live_returns_ok():
    c = Client()
    r = c.get("/health/live/")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


@pytest.mark.django_db
def test_health_ready_sqlite_ok():
    c = Client()
    r = c.get("/health/ready/")
    assert r.status_code == 200
    assert r.json()["database"] == "ok"


@pytest.mark.django_db
def test_admin_users_list_bounded_db_queries():
    User = get_user_model()
    staff = User.objects.create_user(
        username="staff1", email="staff1@test.invalid", password="pw", is_staff=True
    )
    for i in range(15):
        User.objects.create_user(
            username=f"u{i}", email=f"u{i}@test.invalid", password="pw"
        )

    c = Client()
    c.force_login(staff)
    with CaptureQueriesContext(connection) as ctx:
        r = c.get("/api/admin/users/")
    assert r.status_code == 200
    body = r.json()
    assert len(body["results"]) >= 15
    assert len(ctx.captured_queries) <= 12
