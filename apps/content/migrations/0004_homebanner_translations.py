from django.db import migrations, models


def copy_existing_banners_to_ru(apps, schema_editor):
    HomeBanner = apps.get_model("content", "HomeBanner")
    for banner in HomeBanner.objects.all().iterator():
        updates = {}
        if banner.title and not banner.title_ru:
            updates["title_ru"] = banner.title
        if banner.subtitle and not banner.subtitle_ru:
            updates["subtitle_ru"] = banner.subtitle
        if banner.button_label and not banner.button_label_ru:
            updates["button_label_ru"] = banner.button_label
        if updates:
            HomeBanner.objects.filter(pk=banner.pk).update(**updates)


class Migration(migrations.Migration):
    dependencies = [
        ("content", "0003_newsitem_translations"),
    ]

    operations = [
        migrations.AlterField(
            model_name="homebanner",
            name="title",
            field=models.CharField(blank=True, max_length=255),
        ),
        migrations.AddField(
            model_name="homebanner",
            name="title_ru",
            field=models.CharField(blank=True, max_length=255, verbose_name="Title RU"),
        ),
        migrations.AddField(
            model_name="homebanner",
            name="title_uz",
            field=models.CharField(blank=True, max_length=255, verbose_name="Title UZ"),
        ),
        migrations.AddField(
            model_name="homebanner",
            name="title_en",
            field=models.CharField(blank=True, max_length=255, verbose_name="Title EN"),
        ),
        migrations.AddField(
            model_name="homebanner",
            name="subtitle_ru",
            field=models.TextField(blank=True, verbose_name="Subtitle RU"),
        ),
        migrations.AddField(
            model_name="homebanner",
            name="subtitle_uz",
            field=models.TextField(blank=True, verbose_name="Subtitle UZ"),
        ),
        migrations.AddField(
            model_name="homebanner",
            name="subtitle_en",
            field=models.TextField(blank=True, verbose_name="Subtitle EN"),
        ),
        migrations.AddField(
            model_name="homebanner",
            name="button_label_ru",
            field=models.CharField(blank=True, max_length=100, verbose_name="Button label RU"),
        ),
        migrations.AddField(
            model_name="homebanner",
            name="button_label_uz",
            field=models.CharField(blank=True, max_length=100, verbose_name="Button label UZ"),
        ),
        migrations.AddField(
            model_name="homebanner",
            name="button_label_en",
            field=models.CharField(blank=True, max_length=100, verbose_name="Button label EN"),
        ),
        migrations.RunPython(copy_existing_banners_to_ru, migrations.RunPython.noop),
    ]
