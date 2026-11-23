from django.contrib import admin
from .models import CompetencyCategory, Competency, EmployeeCompetency, CompetencyEvaluationLog


@admin.register(CompetencyCategory)
class CompetencyCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'created_at')
    search_fields = ('name',)


@admin.register(Competency)
class CompetencyAdmin(admin.ModelAdmin):
    list_display = ('code', 'name', 'category', 'target_level', 'is_active')
    list_filter = ('category', 'target_level', 'is_active')
    search_fields = ('code', 'name', 'description')
    filter_horizontal = ('associated_courses', 'associated_programs')


@admin.register(EmployeeCompetency)
class EmployeeCompetencyAdmin(admin.ModelAdmin):
    list_display = ('employee', 'competency', 'current_level', 'status', 'evaluated_by', 'evaluated_at')
    list_filter = ('current_level', 'status')
    search_fields = ('employee__employee_id', 'employee__user__first_name', 'employee__user__last_name', 'competency__code')


@admin.register(CompetencyEvaluationLog)
class CompetencyEvaluationLogAdmin(admin.ModelAdmin):
    list_display = ('employee_competency', 'assessed_level', 'status', 'evaluated_by', 'evaluated_at')
    list_filter = ('assessed_level', 'status')
