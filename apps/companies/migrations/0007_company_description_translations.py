from django.db import migrations, models


def copy_existing_company_descriptions_to_ru(apps, schema_editor):
    Company = apps.get_model("companies", "Company")
    for company in Company.objects.exclude(description=""):
        company.description_ru = company.description
        company.save(update_fields=["description_ru"])


def clear_copied_company_descriptions(apps, schema_editor):
    Company = apps.get_model("companies", "Company")
    Company.objects.update(description_ru="")


class Migration(migrations.Migration):

    dependencies = [
        ("companies", "0006_jobposting_publish_as_company"),
    ]

    operations = [
        migrations.AddField(
            model_name="company",
            name="description_en",
            field=models.TextField(blank=True, verbose_name="Description EN"),
        ),
        migrations.AddField(
            model_name="company",
            name="description_ru",
            field=models.TextField(blank=True, verbose_name="Description RU"),
        ),
        migrations.AddField(
            model_name="company",
            name="description_uz",
            field=models.TextField(blank=True, verbose_name="Description UZ"),
        ),
        migrations.RunPython(
            copy_existing_company_descriptions_to_ru,
            clear_copied_company_descriptions,
        ),
    ]
