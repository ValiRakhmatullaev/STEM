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
    list_display = ("title", "company", "experience_level", "employment_type", "has_apply_url", "is_active", "published_at")
    list_filter = ("is_active", "experience_level", "employment_type", "location_type")
    search_fields = ("title", "company__company_name", "apply_url")

    @admin.display(boolean=True, description="External apply link")
    def has_apply_url(self, obj):
        return bool(obj.apply_url)
