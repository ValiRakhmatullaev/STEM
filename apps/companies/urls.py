from django.urls import path

from . import views

urlpatterns = [
    path("", views.company_list),
    path("register/", views.company_register),
    path("me/", views.company_me),
    path("dashboard/", views.company_dashboard_stats),
    path("talents/", views.company_verified_participants),
    path("my-jobs/", views.company_my_jobs),
    path("my-jobs/create/", views.company_create_job),
    path("my-jobs/<int:job_id>/toggle/", views.company_toggle_job),
    path("my-jobs/<int:job_id>/applicants/", views.company_job_applicants),
    path("my-applicants/", views.company_all_applicants),
    path("applicants/<int:application_id>/status/", views.company_update_applicant),
    path("<int:pk>/", views.company_detail),
    path("jobs/", views.job_list),
    path("jobs/<int:pk>/", views.job_detail),
]
