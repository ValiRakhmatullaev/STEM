from django.contrib import admin
from .models import Event, EventRegistration


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ("display_title", "event_type", "date", "time", "is_online", "is_published", "registered_count", "capacity")
    list_filter = ("is_published", "event_type", "is_online", "date")
    search_fields = (
        "title",
        "title_ru",
        "title_uz",
        "title_en",
        "description_ru",
        "description_uz",
        "description_en",
        "location",
    )
    prepopulated_fields = {"slug": ("title_ru",)}
    fieldsets = (
        ("Main", {"fields": ("slug", "event_type", "organizer")}),
        ("Russian", {"fields": ("title_ru", "description_ru")}),
        ("Uzbek", {"fields": ("title_uz", "description_uz")}),
        ("English", {"fields": ("title_en", "description_en")}),
        ("Schedule and format", {
            "fields": ("date", "time", "duration_minutes", "location", "is_online", "meeting_link"),
        }),
        ("Media", {"fields": ("banner_image",)}),
        ("Capacity and publishing", {
            "fields": ("capacity", "registered_count", "waitlist_count", "is_published"),
        }),
        ("Legacy fallback", {
            "classes": ("collapse",),
            "fields": ("title", "description"),
        }),
    )

    @admin.display(description="Title")
    def display_title(self, obj):
        return str(obj)

    def save_model(self, request, obj, form, change):
        obj.title = obj.title_ru or obj.title or obj.title_uz or obj.title_en
        obj.description = obj.description_ru or obj.description or obj.description_uz or obj.description_en
        super().save_model(request, obj, form, change)


@admin.register(EventRegistration)
class EventRegistrationAdmin(admin.ModelAdmin):
    list_display = (
        "user",
        "event",
        "status",
        "is_waitlist",
        "organizer_confirmed",
        "visits_count",
        "registered_at",
    )
    list_filter = ("event", "status", "is_waitlist", "organizer_confirmed")
    search_fields = ("user__username", "event__title", "qr_token")
    readonly_fields = ("qr_token", "visits_count", "last_visit_at")
    actions = ["confirm_selected"]

    @admin.action(description="Подтвердить выбранные")
    def confirm_selected(self, request, queryset):
        updated = queryset.filter(status="registered", organizer_confirmed=False).update(organizer_confirmed=True)
        self.message_user(request, f"Подтверждено записей: {updated}.")

