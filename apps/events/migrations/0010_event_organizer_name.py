from django.db import migrations, models


def backfill_organizer_name(apps, schema_editor):
    Event = apps.get_model("events", "Event")
    for event in Event.objects.select_related("organizer").all().iterator():
        if event.organizer_id and not event.organizer_name:
            event.organizer_name = event.organizer.username
            event.save(update_fields=["organizer_name"])


class Migration(migrations.Migration):

    dependencies = [
        ("events", "0009_event_translations"),
    ]

    operations = [
        migrations.AddField(
            model_name="event",
            name="organizer_name",
            field=models.CharField(
                blank=True,
                help_text="Public organizer name shown on the website. If empty, the linked organizer username is used.",
                max_length=255,
            ),
        ),
        migrations.RunPython(backfill_organizer_name, migrations.RunPython.noop),
    ]
