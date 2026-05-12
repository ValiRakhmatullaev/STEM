# New registrations require organizer confirmation

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("events", "0003_add_organizer_confirmed"),
    ]

    operations = [
        migrations.AlterField(
            model_name="eventregistration",
            name="organizer_confirmed",
            field=models.BooleanField(
                default=False,
                help_text="Организатор или администратор подтвердил участие.",
                verbose_name="Подтверждено организатором",
            ),
        ),
    ]
