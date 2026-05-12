from django.db import models


class HomeBanner(models.Model):
    title = models.CharField(max_length=255)
    subtitle = models.TextField(blank=True)
    button_label = models.CharField(max_length=100, blank=True)
    button_url = models.CharField(max_length=300, blank=True)
    image = models.ImageField(
        upload_to="home/banners/%Y/%m/",
        blank=True,
        null=True,
    )
    is_active = models.BooleanField(default=True)
    priority = models.PositiveIntegerField(default=100, help_text="Меньше число — выше в списке.")
    starts_at = models.DateField(blank=True, null=True)
    ends_at = models.DateField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Home banner"
        verbose_name_plural = "Home banners"
        ordering = ("priority", "-created_at")

    def __str__(self) -> str:
        return self.title


class NewsItem(models.Model):
    title = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True)
    summary = models.TextField(blank=True)
    content = models.TextField(blank=True)
    banner_image = models.ImageField(
        upload_to="home/news/%Y/%m/",
        blank=True,
        null=True,
        verbose_name="Картинка новости",
        help_text="Показывается на странице новости сверху. Необязательно.",
    )
    is_published = models.BooleanField(default=False)
    published_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "News item"
        verbose_name_plural = "News items"
        ordering = ("-published_at", "-created_at")

    def __str__(self) -> str:
        return self.title

