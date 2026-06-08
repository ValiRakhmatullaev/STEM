from django.db import migrations, models


def keep_existing_jobs_as_company(apps, schema_editor):
    JobPosting = apps.get_model("companies", "JobPosting")
    JobPosting.objects.update(publish_as_company=True)


def reset_existing_jobs_to_site(apps, schema_editor):
    JobPosting = apps.get_model("companies", "JobPosting")
    JobPosting.objects.update(publish_as_company=False)


class Migration(migrations.Migration):

    dependencies = [
        ("companies", "0005_jobposting_translations"),
    ]

    operations = [
        migrations.AddField(
            model_name="jobposting",
            name="publish_as_company",
            field=models.BooleanField(
                default=False,
                help_text="Show the selected company as the public publisher. If disabled, the job is shown as posted by STEM Woman Uzbekistan.",
            ),
        ),
        migrations.RunPython(keep_existing_jobs_as_company, reset_existing_jobs_to_site),
    ]
