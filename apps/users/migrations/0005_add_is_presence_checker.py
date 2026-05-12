from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("users", "0004_add_registration_profile_fields"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="is_presence_checker",
            field=models.BooleanField(
                default=False,
                help_text="Может отмечать посещаемость по QR (presence checker).",
            ),
        ),
    ]

