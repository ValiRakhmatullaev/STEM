"""
URL configuration for STEM Women Uzbekistan.
"""
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, include

from apps.events.views import event_checkin
from apps.admin_dashboard.views import checkins_simple_page

urlpatterns = [
    path("admin/", admin.site.urls),
    path("ckeditor/", include("ckeditor_uploader.urls")),
    # QR check-in: сканер на телефоне открывает эту ссылку
    path("checkin/<str:token>/", event_checkin, name="event-checkin"),
    path("api/auth/", include("apps.users.urls")),
    path("api/home/", include("apps.content.urls")),
    path("api/companies/", include("apps.companies.urls")),
    path("api/events/", include("apps.events.urls")),
    path("api/career-fairs/", include("apps.career_fairs.urls")),
    path("api/jobs/", include("apps.jobs.urls")),
    path("api/chat/", include("apps.chat.urls")),
    path("api/admin/", include("apps.admin_dashboard.urls")),
    path("api/notifications/", include("apps.notifications.urls")),
    path("checkins-simple/", checkins_simple_page),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
