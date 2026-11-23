from rest_framework import serializers
from .models import Certificate
from employees.models import Employee


class CertificateSerializer(serializers.ModelSerializer):
    employee_details = serializers.SerializerMethodField()
    course_title = serializers.SerializerMethodField()
    program_title = serializers.SerializerMethodField()
    issued_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Certificate
        fields = [
            'id',
            'certificate_number',
            'verification_code',
            'title',
            'employee',
            'employee_details',
            'course',
            'course_title',
            'training_program',
            'program_title',
            'enrollment',
            'issued_by',
            'issued_by_name',
            'issued_at',
            'expiry_date',
            'status',
            'grade_score',
            'metadata',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'certificate_number',
            'verification_code',
            'issued_at',
            'created_at',
            'updated_at',
        ]

    def get_employee_details(self, obj):
        emp = obj.employee
        return {
            'id': emp.id,
            'employee_id': emp.employee_id,
            'first_name': emp.user.first_name,
            'last_name': emp.user.last_name,
            'email': emp.user.email,
            'designation': emp.designation or '',
            'department_name': emp.department.name if emp.department else 'Unassigned',
        }

    def get_course_title(self, obj):
        return obj.course.title if obj.course else None

    def get_program_title(self, obj):
        return obj.training_program.title if obj.training_program else None

    def get_issued_by_name(self, obj):
        if obj.issued_by:
            return f"{obj.issued_by.first_name} {obj.issued_by.last_name}".strip() or obj.issued_by.email
        return None


class PublicCertificateSerializer(serializers.ModelSerializer):
    """Minimal serializer for public verification endpoint — no PII exposure."""
    employee_name = serializers.SerializerMethodField()
    employee_id_display = serializers.SerializerMethodField()
    course_title = serializers.SerializerMethodField()
    program_title = serializers.SerializerMethodField()

    class Meta:
        model = Certificate
        fields = [
            'certificate_number',
            'verification_code',
            'title',
            'employee_name',
            'employee_id_display',
            'course_title',
            'program_title',
            'issued_at',
            'expiry_date',
            'status',
            'grade_score',
        ]

    def get_employee_name(self, obj):
        return f"{obj.employee.user.first_name} {obj.employee.user.last_name}".strip()

    def get_employee_id_display(self, obj):
        return obj.employee.employee_id

    def get_course_title(self, obj):
        return obj.course.title if obj.course else None

    def get_program_title(self, obj):
        return obj.training_program.title if obj.training_program else None
