from django.urls import path

from . import views

urlpatterns = [
    path("", views.home_content),
    path("news/", views.news_list),
    path("news/<int:pk>/", views.news_detail),
]

