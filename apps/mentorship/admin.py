from django.contrib import admin
from .models import MentorshipRequest, MentorshipSession


@admin.register(MentorshipRequest)
class MentorshipRequestAdmin(admin.ModelAdmin):
    list_display = ("mentee", "mentor", "status", "created_at", "responded_at")


@admin.register(MentorshipSession)
class MentorshipSessionAdmin(admin.ModelAdmin):
    list_display = ("request", "date_time", "duration_minutes", "status", "mentee_rating")
