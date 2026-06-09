from django.contrib import admin

from .models import Company, CompanyUser, JobPosting


@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display = ("company_name", "slug", "industry", "size", "is_verified", "created_at")
    search_fields = (
        "company_name",
        "description",
        "description_ru",
        "description_uz",
        "description_en",
        "website",
        "location",
    )
    prepopulated_fields = {"slug": ("company_name",)}
    fieldsets = (
        ("Company", {
            "fields": ("company_name", "slug", "logo", "website", "industry", "size", "location"),
        }),
        ("Russian", {
            "fields": ("description_ru",),
        }),
        ("Uzbek", {
            "fields": ("description_uz",),
        }),
        ("English", {
            "fields": ("description_en",),
        }),
        ("Moderation", {
            "fields": (
                "is_verified",
                "verified_by",
                "verified_at",
                "is_approved_for_talents",
                "approved_for_talents_at",
            ),
        }),
        ("Legacy fallback", {
            "fields": ("description",),
            "classes": ("collapse",),
        }),
    )

    def save_model(self, request, obj, form, change):
        obj.description = obj.description_ru or obj.description or obj.description_uz or obj.description_en
        super().save_model(request, obj, form, change)


class CompanyUserInline(admin.TabularInline):
    model = CompanyUser
    extra = 0


@admin.register(CompanyUser)
class CompanyUserAdmin(admin.ModelAdmin):
    list_display = ("user", "company", "role", "is_active")


@admin.register(JobPosting)
class JobPostingAdmin(admin.ModelAdmin):
    list_display = ("display_title", "public_publisher", "company", "experience_level", "employment_type", "has_apply_url", "is_active", "published_at")
    list_filter = ("is_active", "publish_as_company", "experience_level", "employment_type", "location_type")
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
            "fields": ("company", "publish_as_company", "slug"),
            "description": "By default the job is shown on the public site as posted by STEM Woman Uzbekistan. Enable Publish as company only when the employer should be visible.",
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

    @admin.display(description="Public publisher")
    def public_publisher(self, obj):
        return obj.company.company_name if obj.publish_as_company else "STEM Woman Uzbekistan"

    def save_model(self, request, obj, form, change):
        obj.title = obj.title_ru or obj.title_uz or obj.title_en or obj.title
        obj.description = obj.description_ru or obj.description_uz or obj.description_en or obj.description
        obj.requirements = obj.requirements_ru or obj.requirements_uz or obj.requirements_en or obj.requirements
        super().save_model(request, obj, form, change)
