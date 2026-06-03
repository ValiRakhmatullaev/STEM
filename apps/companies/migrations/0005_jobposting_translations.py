from django.db import migrations, models


def copy_existing_jobs_to_ru(apps, schema_editor):
    JobPosting = apps.get_model("companies", "JobPosting")
    for job in JobPosting.objects.all().iterator():
        updates = {}
        if job.title and not job.title_ru:
            updates["title_ru"] = job.title
        if job.description and not job.description_ru:
            updates["description_ru"] = job.description
        if job.requirements and not job.requirements_ru:
            updates["requirements_ru"] = job.requirements
        if updates:
            JobPosting.objects.filter(pk=job.pk).update(**updates)


class Migration(migrations.Migration):

    dependencies = [
        ("companies", "0004_jobposting_apply_url"),
    ]

    operations = [
        migrations.AlterField(
            model_name="jobposting",
            name="title",
            field=models.CharField(blank=True, max_length=255),
        ),
        migrations.AlterField(
            model_name="jobposting",
            name="description",
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name="jobposting",
            name="title_ru",
            field=models.CharField(blank=True, max_length=255, verbose_name="Title RU"),
        ),
        migrations.AddField(
            model_name="jobposting",
            name="title_uz",
            field=models.CharField(blank=True, max_length=255, verbose_name="Title UZ"),
        ),
        migrations.AddField(
            model_name="jobposting",
            name="title_en",
            field=models.CharField(blank=True, max_length=255, verbose_name="Title EN"),
        ),
        migrations.AddField(
            model_name="jobposting",
            name="description_ru",
            field=models.TextField(blank=True, verbose_name="Description RU"),
        ),
        migrations.AddField(
            model_name="jobposting",
            name="description_uz",
            field=models.TextField(blank=True, verbose_name="Description UZ"),
        ),
        migrations.AddField(
            model_name="jobposting",
            name="description_en",
            field=models.TextField(blank=True, verbose_name="Description EN"),
        ),
        migrations.AddField(
            model_name="jobposting",
            name="requirements_ru",
            field=models.TextField(blank=True, verbose_name="Requirements RU"),
        ),
        migrations.AddField(
            model_name="jobposting",
            name="requirements_uz",
            field=models.TextField(blank=True, verbose_name="Requirements UZ"),
        ),
        migrations.AddField(
            model_name="jobposting",
            name="requirements_en",
            field=models.TextField(blank=True, verbose_name="Requirements EN"),
        ),
        migrations.RunPython(copy_existing_jobs_to_ru, migrations.RunPython.noop),
    ]
