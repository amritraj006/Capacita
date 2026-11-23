from rest_framework import serializers
from .models import CompetencyCategory, Competency, EmployeeCompetency, CompetencyEvaluationLog
from employees.serializers import EmployeeSerializer
from courses.serializers import CourseSerializer
from training.serializers import TrainingProgramSerializer


class CompetencyCategorySerializer(serializers.ModelSerializer):
    competencies_count = serializers.IntegerField(source='competencies.count', read_only=True)

    class Meta:
        model = CompetencyCategory
        fields = ['id', 'name', 'description', 'competencies_count', 'created_at', 'updated_at']


class CompetencySerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    associated_courses_details = serializers.SerializerMethodField(read_only=True)
    associated_programs_details = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Competency
        fields = [
            'id', 'code', 'name', 'category', 'category_name', 'description',
            'target_level', 'associated_courses', 'associated_courses_details',
            'associated_programs', 'associated_programs_details',
            'is_active', 'created_at', 'updated_at'
        ]

    def get_associated_courses_details(self, obj):
        return [
            {'id': c.id, 'code': c.code, 'title': c.title, 'level': c.level}
            for c in obj.associated_courses.all()
        ]

    def get_associated_programs_details(self, obj):
        return [
            {'id': p.id, 'code': p.code, 'title': p.title, 'status': p.status}
            for p in obj.associated_programs.all()
        ]


class CompetencyEvaluationLogSerializer(serializers.ModelSerializer):
    evaluated_by_name = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = CompetencyEvaluationLog
        fields = ['id', 'assessed_level', 'status', 'evaluated_by', 'evaluated_by_name', 'evaluated_at', 'comments']

    def get_evaluated_by_name(self, obj):
        if obj.evaluated_by:
            name = f"{obj.evaluated_by.first_name} {obj.evaluated_by.last_name}".strip()
            return name if name else obj.evaluated_by.email
        return 'System'


class EmployeeCompetencySerializer(serializers.ModelSerializer):
    employee_details = serializers.SerializerMethodField(read_only=True)
    competency_details = CompetencySerializer(source='competency', read_only=True)
    evaluated_by_name = serializers.SerializerMethodField(read_only=True)
    evaluation_history = CompetencyEvaluationLogSerializer(many=True, read_only=True)

    class Meta:
        model = EmployeeCompetency
        fields = [
            'id', 'employee', 'employee_details', 'competency', 'competency_details',
            'current_level', 'status', 'evaluated_by', 'evaluated_by_name',
            'evaluated_at', 'evaluation_notes', 'evaluation_history',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['evaluated_by', 'evaluated_at']

    def get_employee_details(self, obj):
        emp = obj.employee
        u = emp.user
        return {
            'id': emp.id,
            'employee_id': emp.employee_id,
            'first_name': u.first_name,
            'last_name': u.last_name,
            'email': u.email,
            'designation': emp.designation,
            'department_name': emp.department.name if emp.department else 'Unassigned'
        }

    def get_evaluated_by_name(self, obj):
        if obj.evaluated_by:
            name = f"{obj.evaluated_by.first_name} {obj.evaluated_by.last_name}".strip()
            return name if name else obj.evaluated_by.email
        return None
