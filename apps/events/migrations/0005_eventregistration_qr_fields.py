from django.db import migrations, models
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ("events", "0004_organizer_confirmed_default_false"),
    ]

    operations = [
        migrations.AddField(
            model_name="eventregistration",
            name="qr_token",
            field=models.CharField(
                default=uuid.uuid4,
                editable=False,
                help_text="Уникальный токен для QR-кода (используется только для отметки посещаемости).",
                max_length=64,
                unique=True,
            ),
        ),
        migrations.AddField(
            model_name="eventregistration",
            name="visits_count",
            field=models.PositiveIntegerField(default=0),
        ),
        migrations.AddField(
            model_name="eventregistration",
            name="last_visit_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]

