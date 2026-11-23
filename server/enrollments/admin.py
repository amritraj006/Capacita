from django.contrib import admin
from .models import Enrollment

@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):
    list_display = ('employee', 'course', 'training_program', 'enrollment_type', 'status', 'enrolled_at', 'completed_at')
    list_filter = ('status', 'enrollment_type', 'enrolled_at')
    search_fields = ('employee__employee_id', 'employee__user__email', 'course__code', 'training_program__code')
