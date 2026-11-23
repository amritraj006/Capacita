from django.contrib import admin
from .models import Course, CourseModule

class CourseModuleInline(admin.TabularInline):
    model = CourseModule
    extra = 1

@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ('code', 'title', 'category', 'level', 'instructor', 'is_active', 'created_at')
    list_filter = ('category', 'level', 'is_active')
    search_fields = ('code', 'title', 'instructor')
    inlines = [CourseModuleInline]

@admin.register(CourseModule)
class CourseModuleAdmin(admin.ModelAdmin):
    list_display = ('title', 'course', 'content_type', 'order')
    list_filter = ('content_type',)
    search_fields = ('title', 'course__code', 'course__title')
