from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("events", "0011_event_organizer_optional"),
    ]

    operations = [
        migrations.AlterField(
            model_name="event",
            name="organizer_name",
            field=models.TextField(
                blank=True,
                help_text="Public organizer names shown on the website. Add one organizer per line. If empty, the linked organizer username is used.",
            ),
        ),
    ]
