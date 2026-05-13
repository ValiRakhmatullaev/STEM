
from django.contrib import admin

from .models import AuditEvent


@admin.register(AuditEvent)
class AuditEventAdmin(admin.ModelAdmin):
    list_display = ("created_at", "action", "actor", "target_type", "target_id", "request_id", "ip_address")
    list_filter = ("action", "target_type", "created_at")
    search_fields = ("action", "target_type", "target_id", "request_id", "actor__username", "actor__email")
    readonly_fields = (
        "created_at",
        "updated_at",
        "actor",
        "action",
        "target_type",
        "target_id",
        "request_id",
        "ip_address",
        "user_agent",
        "metadata",
    )

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False
