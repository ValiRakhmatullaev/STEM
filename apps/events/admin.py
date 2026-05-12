from django.contrib import admin
from .models import Event, EventRegistration


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ("title", "event_type", "date", "time", "is_online", "is_published", "registered_count", "capacity")


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

