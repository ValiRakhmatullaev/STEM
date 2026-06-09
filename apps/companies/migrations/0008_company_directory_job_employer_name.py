import django.db.models.deletion
from django.db import migrations, models


def backfill_job_employer_names(apps, schema_editor):
    JobPosting = apps.get_model("companies", "JobPosting")
    for job in JobPosting.objects.select_related("company").all().iterator():
        if job.company_id and not job.employer_name:
            job.employer_name = job.company.company_name
            job.save(update_fields=["employer_name"])


class Migration(migrations.Migration):

    dependencies = [
        ("companies", "0007_company_description_translations"),
    ]

    operations = [
        migrations.AddField(
            model_name="company",
            name="show_in_directory",
            field=models.BooleanField(
                db_index=True,
                default=True,
                help_text="Show this company in the public Companies section.",
            ),
        ),
        migrations.AddField(
            model_name="jobposting",
            name="employer_name",
            field=models.CharField(
                blank=True,
                help_text="Public employer name for this job or internship. Use this when the employer should not be added to the Companies section.",
                max_length=255,
            ),
        ),
        migrations.RunPython(backfill_job_employer_names, migrations.RunPython.noop),
        migrations.AlterField(
            model_name="jobposting",
            name="company",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="job_postings",
                to="companies.company",
            ),
        ),
        migrations.AlterField(
            model_name="jobposting",
            name="employment_type",
            field=models.CharField(
                choices=[
                    ("full_time", "Full time"),
                    ("part_time", "Part time"),
                    ("contract", "Contract"),
                    ("internship", "Internship"),
                    ("fellowship", "Fellowship"),
                ],
                db_index=True,
                max_length=20,
            ),
        ),
    ]
