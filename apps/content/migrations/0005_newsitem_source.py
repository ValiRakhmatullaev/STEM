from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("content", "0004_homebanner_translations"),
    ]

    operations = [
        migrations.AddField(
            model_name="newsitem",
            name="source_id",
            field=models.PositiveIntegerField(blank=True, db_index=True, null=True),
        ),
        migrations.AddField(
            model_name="newsitem",
            name="source_type",
            field=models.CharField(
                choices=[
                    ("manual", "Manual"),
                    ("event", "Event"),
                    ("opportunity", "Opportunity"),
                    ("job", "Job"),
                ],
                db_index=True,
                default="manual",
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="newsitem",
            name="source_url",
            field=models.CharField(blank=True, max_length=300),
        ),
        migrations.AddConstraint(
            model_name="newsitem",
            constraint=models.UniqueConstraint(
                fields=("source_type", "source_id"),
                name="unique_auto_news_source",
            ),
        ),
    ]
