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
    list_display = ("title", "company", "experience_level", "employment_type", "is_active", "published_at")
