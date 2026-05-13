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


@pytest.mark.django_db
def test_job_apply_rejects_non_pdf_extension():
    User = get_user_model()
    applicant = User.objects.create_user(
        username="cand", email="cand@test.invalid", password="pw"
    )
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
