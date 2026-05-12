# Generated manually

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("events", "0002_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="eventregistration",
            name="organizer_confirmed",
            field=models.BooleanField(
                default=True,
                help_text="Организатор или администратор подтвердил участие.",
                verbose_name="Подтверждено организатором",
            ),
        ),
    ]
