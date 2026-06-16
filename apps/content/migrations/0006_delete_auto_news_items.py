from django.db import migrations


def delete_auto_news_items(apps, schema_editor):
    NewsItem = apps.get_model("content", "NewsItem")
    NewsItem.objects.exclude(source_type="manual").delete()


class Migration(migrations.Migration):

    dependencies = [
        ("content", "0005_newsitem_source"),
    ]

    operations = [
        migrations.RunPython(delete_auto_news_items, migrations.RunPython.noop),
    ]
