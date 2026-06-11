from django.contrib import admin
from .models import CareerFair, CareerFairCompany, CareerFairRegistration


@admin.register(CareerFair)
class CareerFairAdmin(admin.ModelAdmin):
    list_display = ("display_title", "date_start", "date_end", "has_external_url", "is_active", "registered_companies_count", "max_companies")
    list_filter = ("is_active", "date_start")
    search_fields = ("title", "title_ru", "title_uz", "title_en", "location", "external_url")
    prepopulated_fields = {"slug": ("title_ru",)}
    fieldsets = (
        ("Main", {"fields": ("slug", "location", "date_start", "date_end", "external_url")}),
        ("Russian", {"fields": ("title_ru", "description_ru")}),
        ("Uzbek", {"fields": ("title_uz", "description_uz")}),
        ("English", {"fields": ("title_en", "description_en")}),
        ("Media", {"fields": ("banner_image",)}),
        ("Publishing", {"fields": ("is_active", "max_companies", "registered_companies_count")}),
        ("Legacy fallback", {"classes": ("collapse",), "fields": ("title", "description")}),
    )

    @admin.display(description="Opportunity")
    def display_title(self, obj: CareerFair) -> str:
        return str(obj)

    @admin.display(boolean=True, description="External link")
    def has_external_url(self, obj: CareerFair) -> bool:
        return bool(obj.external_url)

    def save_model(self, request, obj, form, change):
        obj.title = obj.title_ru or obj.title or obj.title_uz or obj.title_en
        obj.description = obj.description_ru or obj.description or obj.description_uz or obj.description_en
        super().save_model(request, obj, form, change)


@admin.register(CareerFairCompany)
class CareerFairCompanyAdmin(admin.ModelAdmin):
    list_display = ("career_fair", "company", "booth_number", "is_premium", "registered_at")


@admin.register(CareerFairRegistration)
class CareerFairRegistrationAdmin(admin.ModelAdmin):
    list_display = ("user", "career_fair", "status", "registered_at")
