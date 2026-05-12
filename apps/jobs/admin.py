from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from .models import JobApplication, ApplicationStatus


@admin.register(JobApplication)
class JobApplicationAdmin(admin.ModelAdmin):
    list_display = ("job", "applicant", "status", "applied_at", "updated_at")
    list_filter = ("status",)
    search_fields = ("job__title", "applicant__email")
    readonly_fields = ("applied_at",)
    ordering = ("-applied_at",)

    @admin.action(description=_("Принять (в шорт-лист)"))
    def accept_applications(self, request, queryset):
        updated = queryset.update(status=ApplicationStatus.SHORTLISTED)
        self.message_user(request, _("Принято заявок: %d") % updated)

    @admin.action(description=_("Отклонить"))
    def reject_applications(self, request, queryset):
        updated = queryset.update(status=ApplicationStatus.REJECTED)
        self.message_user(request, _("Отклонено заявок: %d") % updated)

    actions = [accept_applications, reject_applications]
