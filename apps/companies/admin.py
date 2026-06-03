from django.contrib import admin

from .models import Company, CompanyUser, JobPosting


@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display = ("company_name", "slug", "industry", "size", "is_verified", "created_at")


class CompanyUserInline(admin.TabularInline):
    model = CompanyUser
    extra = 0


@admin.register(CompanyUser)
class CompanyUserAdmin(admin.ModelAdmin):
    list_display = ("user", "company", "role", "is_active")


@admin.register(JobPosting)
class JobPostingAdmin(admin.ModelAdmin):
    list_display = ("display_title", "company", "experience_level", "employment_type", "has_apply_url", "is_active", "published_at")
    list_filter = ("is_active", "experience_level", "employment_type", "location_type")
    search_fields = (
        "title",
        "title_ru",
        "title_uz",
        "title_en",
        "description_ru",
        "description_uz",
        "description_en",
        "company__company_name",
        "apply_url",
    )
    prepopulated_fields = {"slug": ("title_ru",)}
    fieldsets = (
        ("Company", {
            "fields": ("company", "slug"),
        }),
        ("Russian", {
            "fields": ("title_ru", "description_ru", "requirements_ru"),
        }),
        ("Uzbek", {
            "fields": ("title_uz", "description_uz", "requirements_uz"),
        }),
        ("English", {
            "fields": ("title_en", "description_en", "requirements_en"),
        }),
        ("Job details", {
            "fields": (
                "skills_required",
                "experience_level",
                "employment_type",
                "location_type",
                "salary_min",
                "salary_max",
                "apply_url",
            ),
        }),
        ("Publishing", {
            "fields": ("is_active", "published_at", "expires_at"),
        }),
        ("Counters", {
            "fields": ("views_count", "applications_count"),
            "classes": ("collapse",),
        }),
    )

    @admin.display(boolean=True, description="External apply link")
    def has_apply_url(self, obj):
        return bool(obj.apply_url)

    @admin.display(description="Title")
    def display_title(self, obj):
        return obj.title_ru or obj.title or obj.title_uz or obj.title_en

    def save_model(self, request, obj, form, change):
        obj.title = obj.title_ru or obj.title_uz or obj.title_en or obj.title
        obj.description = obj.description_ru or obj.description_uz or obj.description_en or obj.description
        obj.requirements = obj.requirements_ru or obj.requirements_uz or obj.requirements_en or obj.requirements
        super().save_model(request, obj, form, change)
