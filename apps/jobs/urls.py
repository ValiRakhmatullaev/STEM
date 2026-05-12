from django.urls import path
from . import views

urlpatterns = [
    path("apply/<int:job_id>/", views.job_apply),
    path("my-applications/", views.my_applications),
]
