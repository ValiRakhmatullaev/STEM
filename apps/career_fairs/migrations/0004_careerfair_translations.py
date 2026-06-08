from django.db import migrations, models


def copy_legacy_to_ru(apps, schema_editor):
    CareerFair = apps.get_model("career_fairs", "CareerFair")
    for fair in CareerFair.objects.all():
        changed = False
        if fair.title and not fair.title_ru:
            fair.title_ru = fair.title
            changed = True
        if fair.description and not fair.description_ru:
            fair.description_ru = fair.description
            changed = True
        if changed:
            fair.save(update_fields=["title_ru", "description_ru"])


def copy_ru_to_legacy(apps, schema_editor):
    CareerFair = apps.get_model("career_fairs", "CareerFair")
    for fair in CareerFair.objects.all():
        changed = False
        if fair.title_ru and not fair.title:
            fair.title = fair.title_ru
            changed = True
        if fair.description_ru and not fair.description:
            fair.description = fair.description_ru
            changed = True
        if changed:
            fair.save(update_fields=["title", "description"])


class Migration(migrations.Migration):

    dependencies = [
        ("career_fairs", "0003_initial"),
    ]

    operations = [
        migrations.AlterModelOptions(
            name="careerfair",
            options={
                "indexes": [models.Index(fields=["is_active"], name="career_fair_is_acti_7babf1_idx")],
                "ordering": ("-date_start",),
                "verbose_name": "Opportunity",
                "verbose_name_plural": "Opportunities",
            },
        ),
        migrations.AlterModelOptions(
            name="careerfaircompany",
            options={
                "ordering": ("career_fair", "booth_number"),
                "verbose_name": "Opportunity company",
                "verbose_name_plural": "Opportunity companies",
            },
        ),
        migrations.AlterModelOptions(
            name="careerfairregistration",
            options={
                "ordering": ("-registered_at",),
                "verbose_name": "Opportunity registration",
                "verbose_name_plural": "Opportunity registrations",
            },
        ),
        migrations.AlterField(
            model_name="careerfair",
            name="title",
            field=models.CharField(blank=True, max_length=255),
        ),
        migrations.AddField(
            model_name="careerfair",
            name="title_ru",
            field=models.CharField(blank=True, max_length=255, verbose_name="Title (RU)"),
        ),
        migrations.AddField(
            model_name="careerfair",
            name="title_uz",
            field=models.CharField(blank=True, max_length=255, verbose_name="Title (UZ)"),
        ),
        migrations.AddField(
            model_name="careerfair",
            name="title_en",
            field=models.CharField(blank=True, max_length=255, verbose_name="Title (EN)"),
        ),
        migrations.AddField(
            model_name="careerfair",
            name="description_ru",
            field=models.TextField(blank=True, verbose_name="Description (RU)"),
        ),
        migrations.AddField(
            model_name="careerfair",
            name="description_uz",
            field=models.TextField(blank=True, verbose_name="Description (UZ)"),
        ),
        migrations.AddField(
            model_name="careerfair",
            name="description_en",
            field=models.TextField(blank=True, verbose_name="Description (EN)"),
        ),
        migrations.RunPython(copy_legacy_to_ru, copy_ru_to_legacy),
    ]
