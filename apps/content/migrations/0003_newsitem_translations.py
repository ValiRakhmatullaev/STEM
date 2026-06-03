from django.db import migrations, models


def copy_existing_news_to_ru(apps, schema_editor):
    NewsItem = apps.get_model("content", "NewsItem")
    for item in NewsItem.objects.all().iterator():
        updates = {}
        if item.title and not item.title_ru:
            updates["title_ru"] = item.title
        if item.summary and not item.summary_ru:
            updates["summary_ru"] = item.summary
        if item.content and not item.content_ru:
            updates["content_ru"] = item.content
        if updates:
            NewsItem.objects.filter(pk=item.pk).update(**updates)


class Migration(migrations.Migration):

    dependencies = [
        ("content", "0002_alter_newsitem_banner_image"),
    ]

    operations = [
        migrations.AlterField(
            model_name="newsitem",
            name="title",
            field=models.CharField(blank=True, max_length=255),
        ),
        migrations.AddField(
            model_name="newsitem",
            name="title_ru",
            field=models.CharField(blank=True, max_length=255, verbose_name="Title RU"),
        ),
        migrations.AddField(
            model_name="newsitem",
            name="title_uz",
            field=models.CharField(blank=True, max_length=255, verbose_name="Title UZ"),
        ),
        migrations.AddField(
            model_name="newsitem",
            name="title_en",
            field=models.CharField(blank=True, max_length=255, verbose_name="Title EN"),
        ),
        migrations.AddField(
            model_name="newsitem",
            name="summary_ru",
            field=models.TextField(blank=True, verbose_name="Summary RU"),
        ),
        migrations.AddField(
            model_name="newsitem",
            name="summary_uz",
            field=models.TextField(blank=True, verbose_name="Summary UZ"),
        ),
        migrations.AddField(
            model_name="newsitem",
            name="summary_en",
            field=models.TextField(blank=True, verbose_name="Summary EN"),
        ),
        migrations.AddField(
            model_name="newsitem",
            name="content_ru",
            field=models.TextField(blank=True, verbose_name="Content RU"),
        ),
        migrations.AddField(
            model_name="newsitem",
            name="content_uz",
            field=models.TextField(blank=True, verbose_name="Content UZ"),
        ),
        migrations.AddField(
            model_name="newsitem",
            name="content_en",
            field=models.TextField(blank=True, verbose_name="Content EN"),
        ),
        migrations.RunPython(copy_existing_news_to_ru, migrations.RunPython.noop),
    ]
