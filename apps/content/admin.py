from django import forms
from django.contrib import admin
from django.utils import timezone
from ckeditor_uploader.widgets import CKEditorUploadingWidget

from .models import HomeBanner, NewsItem


class NewsItemAdminForm(forms.ModelForm):
    """Форма с богатым редактором для поля «Полный текст»: шрифт, размер, картинки в тексте."""
    content = forms.CharField(widget=CKEditorUploadingWidget(), required=False)

    class Meta:
        model = NewsItem
        fields = "__all__"


@admin.register(HomeBanner)
class HomeBannerAdmin(admin.ModelAdmin):
    list_display = ("title", "is_active", "priority", "has_image", "starts_at", "ends_at", "updated_at")
    list_filter = ("is_active",)
    search_fields = ("title", "subtitle")
    ordering = ("priority", "-updated_at")
    list_editable = ("is_active", "priority")
    fieldsets = (
        ("Текст баннера", {
            "fields": ("title", "subtitle"),
            "description": "Заголовок и подзаголовок показываются справа от картинки (или по центру, если картинки нет).",
        }),
        ("Кнопка", {
            "fields": ("button_label", "button_url"),
            "description": "Необязательно. Например: «Присоединиться», /register",
        }),
        ("Изображение", {
            "fields": ("image",),
            "description": "Картинка слева на полэкрана. Если не загружать — баннер будет только с градиентом и текстом.",
        }),
        ("Показ и приоритет", {
            "fields": ("is_active", "priority", "starts_at", "ends_at"),
            "description": "Активен только один баннер: с меньшим значением «Приоритет» и попадающий в даты (если указаны).",
        }),
    )

    def has_image(self, obj):
        return bool(obj.image)

    has_image.boolean = True
    has_image.short_description = "Есть фото"


@admin.register(NewsItem)
class NewsItemAdmin(admin.ModelAdmin):
    form = NewsItemAdminForm
    list_display = ("title", "is_published", "published_at", "updated_at")
    list_filter = ("is_published",)
    search_fields = ("title", "summary", "content")
    ordering = ("-published_at", "-created_at")
    list_editable = ("is_published",)
    prepopulated_fields = {"slug": ("title",)}
    readonly_fields = ("created_at", "updated_at")
    fieldsets = (
        ("Основное", {
            "fields": ("title", "slug", "summary"),
            "description": "Краткое описание (summary) показывается на главной в блоке «Новости».",
        }),
        ("Картинка новости", {
            "fields": ("banner_image",),
            "description": "Изображение показывается на странице новости сверху. Можно не загружать.",
        }),
        ("Полный текст", {
            "fields": ("content",),
            "description": "Редактор с форматированием: шрифт, размер, жирный, списки, ссылки. Кнопка «Картинка» — вставка изображений в текст (загрузка на сервер). На главной выводятся только заголовок и summary.",
        }),
        ("Публикация", {
            "fields": ("is_published", "published_at"),
            "description": "На главной отображаются только новости с включённым «Опубликовано». Дата — для сортировки и отображения.",
        }),
        ("Служебное", {
            "fields": ("created_at", "updated_at"),
            "classes": ("collapse",),
        }),
    )

    def save_model(self, request, obj, form, change):
        if obj.is_published and obj.published_at is None:
            obj.published_at = timezone.now()
        super().save_model(request, obj, form, change)

