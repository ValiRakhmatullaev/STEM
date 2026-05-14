from django.contrib import admin
from .models import User


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = (
        "username",
        "email",
        "first_name",
        "last_name",
        "is_staff",
        "is_verified_email",
        "personal_data_consent",
        "personal_data_consent_at",
        "created_at",
    )
    readonly_fields = ("personal_data_consent_at", "personal_data_consent_ip")
