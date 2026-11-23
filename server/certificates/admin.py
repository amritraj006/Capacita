from django.contrib import admin
from .models import Certificate


@admin.register(Certificate)
class CertificateAdmin(admin.ModelAdmin):
    list_display = [
        'certificate_number',
        'employee',
        'title',
        'course',
        'training_program',
        'status',
        'issued_at',
        'issued_by',
    ]
    list_filter = ['status', 'issued_at', 'course', 'training_program']
    search_fields = [
        'certificate_number',
        'verification_code',
        'employee__employee_id',
        'employee__user__email',
        'title',
    ]
    readonly_fields = ['certificate_number', 'verification_code', 'issued_at', 'created_at', 'updated_at']
    ordering = ['-issued_at']
