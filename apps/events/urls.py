from django.urls import path

from . import views

urlpatterns = [
    path("", views.event_list),
    path("my-registrations/", views.my_registrations),
    path("<int:pk>/", views.event_detail),
    path("<int:pk>/register/", views.event_register),
]
