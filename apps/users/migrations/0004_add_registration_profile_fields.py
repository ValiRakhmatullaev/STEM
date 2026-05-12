# Generated manually to support extended registration fields

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0003_remove_role_and_profiles"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="age",
            field=models.PositiveIntegerField(blank=True, null=True, help_text="Возраст"),
        ),
        migrations.AddField(
            model_name="user",
            name="city",
            field=models.CharField(blank=True, help_text="Город", max_length=255),
        ),
        migrations.AddField(
            model_name="user",
            name="education_status",
            field=models.CharField(
                blank=True,
                null=True,
                help_text="Статус обучения",
                max_length=20,
                choices=[
                    ("student", "Student"),
                    ("graduate", "Graduate"),
                    ("not_studying", "Not studying"),
                ],
            ),
        ),
        migrations.AddField(
            model_name="user",
            name="university",
            field=models.CharField(blank=True, null=True, help_text="Университет", max_length=255),
        ),
    ]

