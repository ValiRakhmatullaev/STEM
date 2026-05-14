from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0007_alter_user_cv_file_alter_user_profile_photo"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="personal_data_consent",
            field=models.BooleanField(
                default=False,
                help_text="User explicitly agreed to personal data processing during registration.",
            ),
        ),
        migrations.AddField(
            model_name="user",
            name="personal_data_consent_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="user",
            name="personal_data_consent_version",
            field=models.CharField(blank=True, default="", max_length=32),
        ),
        migrations.AddField(
            model_name="user",
            name="personal_data_consent_ip",
            field=models.GenericIPAddressField(blank=True, null=True),
        ),
    ]
