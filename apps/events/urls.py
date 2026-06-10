from django.urls import path

from . import views

urlpatterns = [
    path("", views.event_list),
    path("my-registrations/", views.my_registrations),
    path("confirm-registration/<str:token>/", views.event_registration_confirm, name="event-registration-confirm"),
    path("<int:pk>/", views.event_detail),
    path("<int:pk>/register/", views.event_register),
]
