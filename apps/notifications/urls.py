from django.urls import path
from . import views

urlpatterns = [
    path("", views.notification_list),
    path("unread-count/", views.notification_unread_count),
    path("mark-all-read/", views.notification_mark_all_read),
    path("<int:pk>/read/", views.notification_mark_read),
]
