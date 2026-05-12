from django.urls import path
from . import views

urlpatterns = [
    path("rooms/", views.chat_rooms),
    path("rooms/<int:room_id>/messages/", views.chat_messages),
    path("rooms/<int:room_id>/send/", views.chat_send),
    path("rooms/<int:room_id>/interview/", views.interview_create),
    path("rooms/<int:room_id>/interviews/", views.room_interviews),
    path("interviews/<int:invite_id>/respond/", views.interview_respond),
]
