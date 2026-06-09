import pytest
from django.test import Client

from apps.companies.models import (
    Company,
    CompanySize,
    EmploymentType,
    ExperienceLevel,
    Industry,
    JobPosting,
    LocationType,
)


@pytest.mark.django_db
def test_job_can_show_manual_employer_without_company_profile_link():
    job = JobPosting.objects.create(
        employer_name="Real Employer LLC",
        publish_as_company=False,
        title_ru="Internship",
        slug="manual-employer-internship",
        description_ru="Internship description",
        requirements_ru="Requirements",
        experience_level=ExperienceLevel.JUNIOR,
        employment_type=EmploymentType.INTERNSHIP,
        location_type=LocationType.REMOTE,
        is_active=True,
    )

    client = Client()
    response = client.get("/api/companies/jobs/")
    assert response.status_code == 200
    item = response.json()["results"][0]
    assert item["id"] == job.pk
    assert item["company"] == "Real Employer LLC"
    assert item["employer_name"] == "Real Employer LLC"
    assert item["posted_by_company"] is False
    assert item["publisher_name"] == "STEM Woman Uzbekistan"
    assert item["publisher_company_id"] is None

    detail = client.get(f"/api/companies/jobs/{job.pk}/")
    assert detail.status_code == 200
    detail_data = detail.json()
    assert detail_data["employer_name"] == "Real Employer LLC"
    assert detail_data["company"]["id"] is None
    assert detail_data["company"]["company_name"] == "Real Employer LLC"


@pytest.mark.django_db
def test_job_can_use_fellowship_type_without_company():
    JobPosting.objects.create(
        employer_name="Foundation Partner",
        publish_as_company=False,
        title_ru="Fellowship",
        slug="foundation-fellowship",
        description_ru="Fellowship description",
        requirements_ru="Requirements",
        experience_level=ExperienceLevel.JUNIOR,
        employment_type=EmploymentType.FELLOWSHIP,
        location_type=LocationType.REMOTE,
        is_active=True,
    )

    response = Client().get("/api/companies/jobs/")
    assert response.status_code == 200
    assert response.json()["results"][0]["employment_type"] == "fellowship"


@pytest.mark.django_db
def test_companies_section_only_returns_directory_companies():
    Company.objects.create(
        company_name="Visible Partner",
        slug="visible-partner",
        industry=Industry.SOFTWARE,
        size=CompanySize.MEDIUM,
        location="Tashkent",
        show_in_directory=True,
    )
    Company.objects.create(
        company_name="Hidden Job Source",
        slug="hidden-job-source",
        industry=Industry.OTHER,
        size=CompanySize.SMALL,
        location="Tashkent",
        show_in_directory=False,
    )

    response = Client().get("/api/companies/")
    assert response.status_code == 200
    names = [item["company_name"] for item in response.json()["results"]]
    assert names == ["Visible Partner"]
