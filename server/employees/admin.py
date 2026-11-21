from django.contrib import admin
from .models import Employee

@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ('employee_id', 'get_name', 'department', 'designation', 'is_active', 'joining_date')
    list_filter = ('is_active', 'department')
    search_fields = ('employee_id', 'user__first_name', 'user__last_name', 'user__email', 'designation')

    def get_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}".strip() or obj.user.email
    get_name.short_description = 'Name'
