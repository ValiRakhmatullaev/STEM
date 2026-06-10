import uuid

from django.db import migrations, models


def populate_confirmation_tokens(apps, schema_editor):
    EventRegistration = apps.get_model("events", "EventRegistration")
    for registration in EventRegistration.objects.filter(email_confirmation_token__isnull=True).iterator():
        registration.email_confirmation_token = uuid.uuid4().hex
        registration.save(update_fields=["email_confirmation_token"])


class Migration(migrations.Migration):
    dependencies = [
        ("events", "0012_event_organizer_name_text"),
    ]

    operations = [
        migrations.AddField(
            model_name="eventregistration",
            name="email_confirmation_token",
            field=models.CharField(blank=True, editable=False, max_length=64, null=True, unique=True),
        ),
        migrations.AddField(
            model_name="eventregistration",
            name="confirmation_email_sent_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="eventregistration",
            name="email_confirmed_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.RunPython(populate_confirmation_tokens, migrations.RunPython.noop),
        migrations.AlterField(
            model_name="eventregistration",
            name="email_confirmation_token",
            field=models.CharField(
                default=uuid.uuid4,
                editable=False,
                help_text="Token used to confirm this event registration by email.",
                max_length=64,
                unique=True,
            ),
        ),
    ]
