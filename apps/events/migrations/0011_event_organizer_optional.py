from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("events", "0010_event_organizer_name"),
    ]

    operations = [
        migrations.AlterField(
            model_name="event",
            name="organizer",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="organized_events",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
    ]
