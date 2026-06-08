import pytest
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import Client

from apps.companies.models import (
    Company,
    CompanyUser,
    CompanyUserRole,
    Industry,
    CompanySize,
    JobPosting,
    ExperienceLevel,
    EmploymentType,
    LocationType,
)


def create_company_with_job_user():
    User = get_user_model()
    company_user = User.objects.create_user(
        username="compu", email="compu@test.invalid", password="pw", is_company_user=True
    )
    company = Company.objects.create(
        company_name="Co",
        slug="co",
        industry=Industry.SOFTWARE,
        size=CompanySize.STARTUP,
        location="Tashkent",
        is_verified=True,
        is_approved_for_talents=True,
    )
    CompanyUser.objects.create(
        user=company_user,
        company=company,
        role=CompanyUserRole.ADMIN,
        is_active=True,
    )
    return company_user, company


@pytest.mark.django_db
def test_job_apply_rejects_non_pdf_extension():
    User = get_user_model()
    applicant = User.objects.create_user(
        username="cand", email="cand@test.invalid", password="pw"
    )
    _company_user, company = create_company_with_job_user()
    job = JobPosting.objects.create(
        company=company,
        title="Dev",
        slug="dev",
        description="d",
        requirements="r",
        experience_level=ExperienceLevel.MIDDLE,
        employment_type=EmploymentType.FULL_TIME,
        location_type=LocationType.REMOTE,
    )

    c = Client()
    c.force_login(applicant)
    bad = SimpleUploadedFile("cv.exe", b"MZ", content_type="application/octet-stream")
    r = c.post(
        f"/api/jobs/apply/{job.pk}/",
        data={"cover_letter": "hi", "resume": bad},
    )
    assert r.status_code == 400


@pytest.mark.django_db
def test_company_create_job_rejects_invalid_apply_url():
    company_user, _company = create_company_with_job_user()
    c = Client()
    c.force_login(company_user)

    r = c.post(
        "/api/companies/my-jobs/create/",
        data={
            "title": "Dev",
            "description": "Build things",
            "requirements": "Python",
            "experience_level": ExperienceLevel.MIDDLE,
            "employment_type": EmploymentType.FULL_TIME,
            "location_type": LocationType.REMOTE,
            "apply_url": "not-a-url",
        },
        content_type="application/json",
    )

    assert r.status_code == 400
    assert "apply_url" in r.json()["field_errors"]


@pytest.mark.django_db
def test_company_create_job_persists_valid_apply_url_and_api_exposes_it():
    company_user, _company = create_company_with_job_user()
    c = Client()
    c.force_login(company_user)

    apply_url = "https://example.com/jobs/dev"
    r = c.post(
        "/api/companies/my-jobs/create/",
        data={
            "title": "Dev",
            "description": "Build things",
            "requirements": "Python",
            "experience_level": ExperienceLevel.MIDDLE,
            "employment_type": EmploymentType.FULL_TIME,
            "location_type": LocationType.REMOTE,
            "apply_url": apply_url,
        },
        content_type="application/json",
    )

    assert r.status_code == 201
    job_id = r.json()["id"]

    detail = c.get(f"/api/companies/jobs/{job_id}/")
    assert detail.status_code == 200
    assert detail.json()["apply_url"] == apply_url
