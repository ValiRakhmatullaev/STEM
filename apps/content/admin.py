from django import forms
from django.contrib import admin
from django.utils import timezone

from .models import HomeBanner, NewsItem


class NewsItemAdminForm(forms.ModelForm):
    content_ru = forms.CharField(widget=forms.Textarea(attrs={"rows": 14}), required=False)
    content_uz = forms.CharField(widget=forms.Textarea(attrs={"rows": 14}), required=False)
    content_en = forms.CharField(widget=forms.Textarea(attrs={"rows": 14}), required=False)

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
        ("Banner text", {
            "fields": ("title", "subtitle"),
            "description": "Title and subtitle shown on the home banner.",
        }),
        ("Button", {
            "fields": ("button_label", "button_url"),
            "description": "Optional. Example: Join, /register",
        }),
        ("Image", {
            "fields": ("image",),
            "description": "Optional banner image.",
        }),
        ("Display and priority", {
            "fields": ("is_active", "priority", "starts_at", "ends_at"),
            "description": "Lower priority number appears first.",
        }),
    )

    def has_image(self, obj):
        return bool(obj.image)

    has_image.boolean = True
    has_image.short_description = "Has image"


@admin.register(NewsItem)
class NewsItemAdmin(admin.ModelAdmin):
    form = NewsItemAdminForm
    list_display = ("display_title", "is_published", "published_at", "updated_at")
    list_filter = ("is_published",)
    search_fields = (
        "title",
        "title_ru",
        "title_uz",
        "title_en",
        "summary_ru",
        "summary_uz",
        "summary_en",
        "content_ru",
        "content_uz",
        "content_en",
    )
    ordering = ("-published_at", "-created_at")
    list_editable = ("is_published",)
    prepopulated_fields = {"slug": ("title_ru",)}
    readonly_fields = ("created_at", "updated_at")
    fieldsets = (
        ("Main", {
            "fields": ("slug",),
            "description": "Slug is used in links. It is usually generated from the Russian title.",
        }),
        ("Russian", {
            "fields": ("title_ru", "summary_ru", "content_ru"),
        }),
        ("Uzbek", {
            "fields": ("title_uz", "summary_uz", "content_uz"),
        }),
        ("English", {
            "fields": ("title_en", "summary_en", "content_en"),
        }),
        ("News image", {
            "fields": ("banner_image",),
            "description": "Optional image shown on the news detail page.",
        }),
        ("Publication", {
            "fields": ("is_published", "published_at"),
        }),
        ("System", {
            "fields": ("created_at", "updated_at"),
            "classes": ("collapse",),
        }),
    )

    @admin.display(description="Title")
    def display_title(self, obj):
        return obj.title_ru or obj.title or obj.title_uz or obj.title_en

    def save_model(self, request, obj, form, change):
        obj.title = obj.title_ru or obj.title_uz or obj.title_en or obj.title
        obj.summary = obj.summary_ru or obj.summary_uz or obj.summary_en or obj.summary
        obj.content = obj.content_ru or obj.content_uz or obj.content_en or obj.content
        if obj.is_published and obj.published_at is None:
            obj.published_at = timezone.now()
        super().save_model(request, obj, form, change)
