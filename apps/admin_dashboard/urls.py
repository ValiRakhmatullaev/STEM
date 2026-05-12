from django.urls import path
from . import views

urlpatterns = [
    path("users/", views.admin_users),
    path("users/<int:user_id>/", views.admin_user_detail),
    path("users-analytics/", views.admin_users_analytics),
    path("users-without-event-registrations/", views.admin_users_without_event_registrations),
    path("users-for-presence-checker/", views.admin_all_users_for_presence_checker),
    path("companies/", views.admin_companies),
    path("companies/<int:company_id>/approve-talents/", views.admin_company_approve_talents),
    path("event-registrations/", views.admin_events_registrations),
    path("checkins/", views.admin_checkins),
    path("checkins/<int:registration_id>/confirm/", views.admin_checkin_confirm),
]
