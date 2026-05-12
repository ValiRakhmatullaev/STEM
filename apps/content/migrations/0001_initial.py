from django.db import migrations, models


class Migration(migrations.Migration):
  initial = True

  dependencies = []

  operations = [
    migrations.CreateModel(
      name="HomeBanner",
      fields=[
        ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
        ("title", models.CharField(max_length=255)),
        ("subtitle", models.TextField(blank=True)),
        ("button_label", models.CharField(blank=True, max_length=100)),
        ("button_url", models.CharField(blank=True, max_length=300)),
        ("image", models.ImageField(blank=True, null=True, upload_to="home/banners/%Y/%m/")),
        ("is_active", models.BooleanField(default=True)),
        ("priority", models.PositiveIntegerField(default=100, help_text="Меньше число — выше в списке.")),
        ("starts_at", models.DateField(blank=True, null=True)),
        ("ends_at", models.DateField(blank=True, null=True)),
        ("created_at", models.DateTimeField(auto_now_add=True)),
        ("updated_at", models.DateTimeField(auto_now=True)),
      ],
      options={
        "verbose_name": "Home banner",
        "verbose_name_plural": "Home banners",
        "ordering": ("priority", "-created_at"),
      },
    ),
    migrations.CreateModel(
      name="NewsItem",
      fields=[
        ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
        ("title", models.CharField(max_length=255)),
        ("slug", models.SlugField(max_length=255, unique=True)),
        ("summary", models.TextField(blank=True)),
        ("content", models.TextField(blank=True)),
        ("banner_image", models.ImageField(blank=True, null=True, upload_to="home/news/%Y/%m/")),
        ("is_published", models.BooleanField(default=False)),
        ("published_at", models.DateTimeField(blank=True, null=True)),
        ("created_at", models.DateTimeField(auto_now_add=True)),
        ("updated_at", models.DateTimeField(auto_now=True)),
      ],
      options={
        "verbose_name": "News item",
        "verbose_name_plural": "News items",
        "ordering": ("-published_at", "-created_at"),
      },
    ),
  ]

