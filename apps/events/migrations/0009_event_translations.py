from django.db import migrations, models


def copy_existing_events_to_ru(apps, schema_editor):
    Event = apps.get_model("events", "Event")
    for event in Event.objects.all().iterator():
        updates = {}
        if event.title and not event.title_ru:
            updates["title_ru"] = event.title
        if event.description and not event.description_ru:
            updates["description_ru"] = event.description
        if updates:
            Event.objects.filter(pk=event.pk).update(**updates)


class Migration(migrations.Migration):
    dependencies = [
        ("events", "0008_eventregistration_hot_path_indexes"),
    ]

    operations = [
        migrations.AlterField(
            model_name="event",
            name="title",
            field=models.CharField(blank=True, max_length=255),
        ),
        migrations.AddField(
            model_name="event",
            name="title_ru",
            field=models.CharField(blank=True, max_length=255, verbose_name="Title RU"),
        ),
        migrations.AddField(
            model_name="event",
            name="title_uz",
            field=models.CharField(blank=True, max_length=255, verbose_name="Title UZ"),
        ),
        migrations.AddField(
            model_name="event",
            name="title_en",
            field=models.CharField(blank=True, max_length=255, verbose_name="Title EN"),
        ),
        migrations.AlterField(
            model_name="event",
            name="description",
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name="event",
            name="description_ru",
            field=models.TextField(blank=True, verbose_name="Description RU"),
        ),
        migrations.AddField(
            model_name="event",
            name="description_uz",
            field=models.TextField(blank=True, verbose_name="Description UZ"),
        ),
        migrations.AddField(
            model_name="event",
            name="description_en",
            field=models.TextField(blank=True, verbose_name="Description EN"),
        ),
        migrations.RunPython(copy_existing_events_to_ru, migrations.RunPython.noop),
    ]
