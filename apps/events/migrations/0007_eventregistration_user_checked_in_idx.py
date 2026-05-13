from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("events", "0006_eventregistration_checked_in_and_more"),
    ]

    operations = [
        migrations.AddIndex(
            model_name="eventregistration",
            index=models.Index(fields=["user", "checked_in"], name="evreg_user_checked_in_idx"),
        ),
    ]
