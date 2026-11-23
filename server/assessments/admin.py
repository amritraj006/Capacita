from django.contrib import admin
from .models import Assessment, Question, AssessmentSubmission, SubmissionAnswer


class QuestionInline(admin.TabularInline):
    model = Question
    extra = 1


@admin.register(Assessment)
class AssessmentAdmin(admin.ModelAdmin):
    list_display = ('code', 'title', 'course', 'training_program', 'passing_percentage', 'is_active')
    list_filter = ('is_active', 'passing_percentage')
    search_fields = ('code', 'title', 'description')
    inlines = [QuestionInline]


class SubmissionAnswerInline(admin.TabularInline):
    model = SubmissionAnswer
    extra = 0
    readonly_fields = ('question', 'selected_answer', 'is_correct', 'points_awarded')


@admin.register(AssessmentSubmission)
class AssessmentSubmissionAdmin(admin.ModelAdmin):
    list_display = ('employee', 'assessment', 'attempt_number', 'score', 'percentage', 'is_passed', 'status', 'submitted_at')
    list_filter = ('is_passed', 'status')
    search_fields = ('employee__employee_id', 'assessment__code')
    inlines = [SubmissionAnswerInline]
