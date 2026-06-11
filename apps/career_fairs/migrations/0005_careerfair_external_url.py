from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("career_fairs", "0004_careerfair_translations"),
    ]

    operations = [
        migrations.AddField(
            model_name="careerfair",
            name="external_url",
            field=models.URLField(
                blank=True,
                help_text="Optional external URL for this opportunity.",
                max_length=500,
            ),
        ),
    ]
