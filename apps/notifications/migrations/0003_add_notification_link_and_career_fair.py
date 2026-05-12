# Generated manually for Notification.link and CAREER_FAIR type

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("notifications", "0002_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="notification",
            name="link",
            field=models.CharField(blank=True, help_text="URL for frontend (e.g. /events/1)", max_length=500),
        ),
        migrations.AlterField(
            model_name="notification",
            name="type",
            field=models.CharField(
                choices=[
                    ("event", "Event"),
                    ("mentorship", "Mentorship"),
                    ("company", "Company"),
                    ("system", "System"),
                    ("job", "Job"),
                    ("career_fair", "Career fair"),
                ],
                db_index=True,
                max_length=20,
            ),
        ),
    ]
