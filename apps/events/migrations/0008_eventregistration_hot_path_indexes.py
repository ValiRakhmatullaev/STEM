from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("events", "0007_eventregistration_user_checked_in_idx"),
    ]

    operations = [
        migrations.AddIndex(
            model_name="eventregistration",
            index=models.Index(fields=["event", "status", "is_waitlist"], name="events_even_event_i_8352c9_idx"),
        ),
        migrations.AddIndex(
            model_name="eventregistration",
            index=models.Index(fields=["user", "status"], name="events_even_user_id_642524_idx"),
        ),
        migrations.AddIndex(
            model_name="eventregistration",
            index=models.Index(fields=["checked_in", "checked_in_at"], name="events_even_checked_036b0c_idx"),
        ),
    ]
