from django.db import models


class HomeBanner(models.Model):
    title = models.CharField(max_length=255, blank=True)
    title_ru = models.CharField("Title RU", max_length=255, blank=True)
    title_uz = models.CharField("Title UZ", max_length=255, blank=True)
    title_en = models.CharField("Title EN", max_length=255, blank=True)
    subtitle = models.TextField(blank=True)
    subtitle_ru = models.TextField("Subtitle RU", blank=True)
    subtitle_uz = models.TextField("Subtitle UZ", blank=True)
    subtitle_en = models.TextField("Subtitle EN", blank=True)
    button_label = models.CharField(max_length=100, blank=True)
    button_label_ru = models.CharField("Button label RU", max_length=100, blank=True)
    button_label_uz = models.CharField("Button label UZ", max_length=100, blank=True)
    button_label_en = models.CharField("Button label EN", max_length=100, blank=True)
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
        return self.title_ru or self.title or self.title_uz or self.title_en or str(self.pk)


class NewsItem(models.Model):
    title = models.CharField(max_length=255, blank=True)
    title_ru = models.CharField("Title RU", max_length=255, blank=True)
    title_uz = models.CharField("Title UZ", max_length=255, blank=True)
    title_en = models.CharField("Title EN", max_length=255, blank=True)
    slug = models.SlugField(max_length=255, unique=True)
    summary = models.TextField(blank=True)
    summary_ru = models.TextField("Summary RU", blank=True)
    summary_uz = models.TextField("Summary UZ", blank=True)
    summary_en = models.TextField("Summary EN", blank=True)
    content = models.TextField(blank=True)
    content_ru = models.TextField("Content RU", blank=True)
    content_uz = models.TextField("Content UZ", blank=True)
    content_en = models.TextField("Content EN", blank=True)
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
        return self.title_ru or self.title or self.title_uz or self.title_en or str(self.pk)

