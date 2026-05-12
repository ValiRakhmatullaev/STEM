from django.contrib import admin
from .models import ChatRoom, ChatMessage, InterviewInvite


@admin.register(ChatRoom)
class ChatRoomAdmin(admin.ModelAdmin):
    list_display = ("id", "company_user", "candidate", "application", "is_active", "created_at")
    list_filter = ("is_active",)
    raw_id_fields = ("application", "company_user", "candidate")


@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    list_display = ("id", "room", "sender", "is_read", "created_at")
    list_filter = ("is_read",)
    raw_id_fields = ("room", "sender")


@admin.register(InterviewInvite)
class InterviewInviteAdmin(admin.ModelAdmin):
    list_display = ("id", "room", "scheduled_at", "format", "status", "created_at")
    list_filter = ("status", "format")
    raw_id_fields = ("room",)
