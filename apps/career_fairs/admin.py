from django.contrib import admin
from .models import CareerFair, CareerFairCompany, CareerFairRegistration


@admin.register(CareerFair)
class CareerFairAdmin(admin.ModelAdmin):
    list_display = ("title", "date_start", "date_end", "is_active", "registered_companies_count", "max_companies")


@admin.register(CareerFairCompany)
class CareerFairCompanyAdmin(admin.ModelAdmin):
    list_display = ("career_fair", "company", "booth_number", "is_premium", "registered_at")


@admin.register(CareerFairRegistration)
class CareerFairRegistrationAdmin(admin.ModelAdmin):
    list_display = ("user", "career_fair", "status", "registered_at")
